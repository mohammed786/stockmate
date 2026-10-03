"use server";

import { db } from "@/lib/db";
import { calculateSQMT, calculateValuation, getStockAsOfDate } from "@/lib/stock";
import { toNum } from "@/lib/utils";
import type { StockFilter } from "@/lib/validations";

export interface StockRow {
  productId: string;
  productCode: string;
  productName: string;
  companyId: string;
  companyCode: string;
  companyName: string;
  height: number;
  width: number;
  thickness: number;
  openingSheets: number;
  openingCases: number;
  purchaseSheets: number;
  purchaseCases: number;
  saleSheets: number;
  saleCases: number;
  currentSheets: number;
  currentCases: number;
  sqmt: number;
  mtrRate: number;
  sqmtRate: number;
  valuation: number;
}

export async function getStockReport(filter?: StockFilter): Promise<{
  data: StockRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = filter?.page || 1;
  const pageSize = filter?.pageSize || 50;

  const products = await db.product.findMany({
    where: { isActive: true },
    include: { company: true, stockOpenings: true },
    orderBy: { name: "asc" },
  });

  // Get all movement aggregations in one query
  const movementAggs = await db.stockMovement.groupBy({
    by: ["productId", "type"],
    _sum: { sheets: true, cases: true },
  });

  // Build lookup map
  const movementMap = new Map<string, { purchaseS: number; purchaseC: number; saleS: number; saleC: number }>();
  for (const m of movementAggs) {
    const key = m.productId;
    if (!movementMap.has(key)) {
      movementMap.set(key, { purchaseS: 0, purchaseC: 0, saleS: 0, saleC: 0 });
    }
    const entry = movementMap.get(key)!;
    const s = toNum(m._sum.sheets);
    const c = toNum(m._sum.cases);
    if (m.type === "PURCHASE") {
      entry.purchaseS += s;
      entry.purchaseC += c;
    } else if (m.type === "SALE") {
      entry.saleS += Math.abs(s);
      entry.saleC += Math.abs(c);
    }
  }

  let rows: StockRow[] = products.map((product) => {
    const totalOpenSheets = product.stockOpenings.reduce((s, o) => s + toNum(o.sheets), 0);
    const totalOpenCases = product.stockOpenings.reduce((s, o) => s + toNum(o.cases), 0);
    const movements = movementMap.get(product.id) || { purchaseS: 0, purchaseC: 0, saleS: 0, saleC: 0 };
    const currentSheets = totalOpenSheets + movements.purchaseS - movements.saleS;
    const currentCases = totalOpenCases + movements.purchaseC - movements.saleC;
    const sqmt = calculateSQMT(product.height, product.width, currentSheets);
    const sqmtRate = toNum(product.sqmtRate);
    const valuation = calculateValuation(sqmt, sqmtRate);

    return {
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      companyId: product.companyId,
      companyCode: product.company.code,
      companyName: product.company.name,
      height: toNum(product.height),
      width: toNum(product.width),
      thickness: toNum(product.thickness),
      openingSheets: totalOpenSheets,
      openingCases: totalOpenCases,
      purchaseSheets: movements.purchaseS,
      purchaseCases: movements.purchaseC,
      saleSheets: movements.saleS,
      saleCases: movements.saleC,
      currentSheets,
      currentCases,
      sqmt,
      mtrRate: toNum(product.mtrRate),
      sqmtRate,
      valuation,
    };
  });

  // Apply filters
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.productCode.toLowerCase().includes(q) ||
        r.companyCode.toLowerCase().includes(q)
    );
  }

  if (filter?.companyId) {
    rows = rows.filter((r) => r.companyId === filter.companyId);
  }

  if (filter?.stockStatus) {
    switch (filter.stockStatus) {
      case "in-stock":
        rows = rows.filter((r) => r.currentSheets > 10);
        break;
      case "low-stock":
        rows = rows.filter((r) => r.currentSheets > 0 && r.currentSheets <= 10);
        break;
      case "out-of-stock":
        rows = rows.filter((r) => r.currentSheets <= 0);
        break;
    }
  }

  // Sort
  const sortBy = filter?.sortBy || "name";
  const sortOrder = filter?.sortOrder || "asc";
  rows.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "name":
        cmp = a.productName.localeCompare(b.productName);
        break;
      case "company":
        cmp = a.companyCode.localeCompare(b.companyCode);
        break;
      case "sheets":
        cmp = a.currentSheets - b.currentSheets;
        break;
      case "sqmt":
        cmp = a.sqmt - b.sqmt;
        break;
      case "valuation":
        cmp = a.valuation - b.valuation;
        break;
    }
    return sortOrder === "desc" ? -cmp : cmp;
  });

  const total = rows.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginated = rows.slice((page - 1) * pageSize, page * pageSize);

  return { data: paginated, total, page, pageSize, totalPages };
}

export async function getProductDetail(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { company: true, stockOpenings: true },
  });
  if (!product) throw new Error("Product not found");

  // Get movements
  const movements = await db.stockMovement.findMany({
    where: { productId },
    orderBy: { date: "asc" },
  });

  // Calculate running balance
  const totalOpenSheets = product.stockOpenings.reduce((s, o) => s + toNum(o.sheets), 0);
  const totalOpenCases = product.stockOpenings.reduce((s, o) => s + toNum(o.cases), 0);

  let runningSheets = totalOpenSheets;
  let runningCases = totalOpenCases;

  const movementHistory = movements.map((m) => {
    runningSheets += toNum(m.sheets);
    runningCases += toNum(m.cases);
    return {
      id: m.id,
      date: m.date.toISOString(),
      type: m.type,
      sheets: toNum(m.sheets),
      cases: toNum(m.cases),
      runningSheets,
      runningCases,
      referenceId: m.referenceId,
      referenceType: m.referenceType,
      notes: m.notes,
    };
  });

  const sqmt = calculateSQMT(product.height, product.width, runningSheets);
  const sqmtRate = toNum(product.sqmtRate);
  const valuation = calculateValuation(sqmt, sqmtRate);

  return {
    product: {
      ...product,
      height: toNum(product.height),
      width: toNum(product.width),
      thickness: toNum(product.thickness),
      mtrRate: toNum(product.mtrRate),
      sqmtRate,
    },
    stock: {
      openingSheets: totalOpenSheets,
      openingCases: totalOpenCases,
      currentSheets: runningSheets,
      currentCases: runningCases,
      sqmt,
      valuation,
    },
    movements: movementHistory,
  };
}

export async function getDashboardStats() {
  const [productCount, companies, movements] = await Promise.all([
    db.product.count({ where: { isActive: true } }),
    db.company.findMany({ where: { isActive: true } }),
    db.stockMovement.groupBy({
      by: ["type"],
      _sum: { sheets: true, cases: true },
      _count: true,
    }),
  ]);

  const products = await db.product.findMany({
    where: { isActive: true },
    include: { stockOpenings: true },
  });

  const movementAggs = await db.stockMovement.groupBy({
    by: ["productId", "type"],
    _sum: { sheets: true, cases: true },
  });

  const movementMap = new Map<string, { purchaseS: number; saleS: number }>();
  for (const m of movementAggs) {
    if (!movementMap.has(m.productId)) movementMap.set(m.productId, { purchaseS: 0, saleS: 0 });
    const entry = movementMap.get(m.productId)!;
    if (m.type === "PURCHASE") entry.purchaseS += toNum(m._sum.sheets);
    else if (m.type === "SALE") entry.saleS += Math.abs(toNum(m._sum.sheets));
  }

  let totalSheets = 0;
  let totalSQMT = 0;
  let totalValuation = 0;
  let lowStockCount = 0;

  for (const product of products) {
    const openS = product.stockOpenings.reduce((s, o) => s + toNum(o.sheets), 0);
    const mvt = movementMap.get(product.id) || { purchaseS: 0, saleS: 0 };
    const current = openS + mvt.purchaseS - mvt.saleS;
    const sqmt = calculateSQMT(product.height, product.width, current);
    totalSheets += current;
    totalSQMT += sqmt;
    totalValuation += sqmt * toNum(product.sqmtRate);
    if (current <= 10) lowStockCount++;
  }

  // Monthly stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [monthlyPurchases, monthlySales] = await Promise.all([
    db.purchase.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      include: { items: true },
    }),
    db.sale.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      include: { items: true },
    }),
  ]);

  let monthlyPurchaseSheets = 0;
  for (const p of monthlyPurchases) {
    for (const item of p.items) monthlyPurchaseSheets += toNum(item.sheets);
  }

  let monthlySaleSheets = 0;
  for (const s of monthlySales) {
    for (const item of s.items) monthlySaleSheets += toNum(item.sheets);
  }

  // Recent movements
  const recentMovements = await db.stockMovement.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { product: { include: { company: true } } },
  });

  return {
    productCount,
    companyCount: companies.length,
    totalSheets,
    totalSQMT,
    totalValuation,
    lowStockCount,
    monthlyPurchaseCount: monthlyPurchases.length,
    monthlySaleCount: monthlySales.length,
    monthlyPurchaseSheets,
    monthlySaleSheets,
    recentMovements: recentMovements.map((m) => ({
      id: m.id,
      date: m.date.toISOString(),
      type: m.type,
      sheets: toNum(m.sheets),
      productName: m.product.name,
      companyCode: m.product.company.code,
    })),
  };
}