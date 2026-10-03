"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { productSchema, type ProductInput } from "@/lib/validations";
import { generateProductCode, toNum } from "@/lib/utils";
import { calculateSQMT, calculateSQMTRate } from "@/lib/stock";
import { revalidatePath } from "next/cache";

export async function createProduct(data: ProductInput) {
  const parsed = productSchema.parse(data);
  const company = await db.company.findUnique({ where: { id: parsed.companyId } });
  if (!company) throw new Error("Company not found");

  const code = generateProductCode(company.code, parsed.name);

  // Check for duplicate
  const existing = await db.product.findUnique({ where: { code } });
  if (existing) throw new Error(`Product already exists: ${code}`);

  const product = await db.product.create({
    data: {
      code,
      name: parsed.name,
      companyId: parsed.companyId,
      height: parsed.height,
      width: parsed.width,
      thickness: parsed.thickness,
      mtrRate: parsed.mtrRate,
      sqmtRate: parsed.sqmtRate,
    },
  });

  revalidatePath("/settings/products");
  revalidatePath("/stock");
  return product;
}

export async function updateProduct(id: string, data: ProductInput) {
  const parsed = productSchema.parse(data);

  const product = await db.product.update({
    where: { id },
    data: {
      name: parsed.name,
      companyId: parsed.companyId,
      height: parsed.height,
      width: parsed.width,
      thickness: parsed.thickness,
      mtrRate: parsed.mtrRate,
      sqmtRate: parsed.sqmtRate,
    },
  });

  revalidatePath("/settings/products");
  revalidatePath("/stock");
  return product;
}

export async function getProducts(companyId?: string) {
  const where: Prisma.ProductWhereInput = { isActive: true };
  if (companyId) where.companyId = companyId;

  return db.product.findMany({
    where,
    include: { company: true },
    orderBy: { name: "asc" },
  });
}

export async function getProductById(id: string) {
  return db.product.findUnique({
    where: { id },
    include: { company: true },
  });
}

export async function searchProducts(query: string, companyId?: string) {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { code: { contains: query, mode: "insensitive" } },
    ],
  };
  if (companyId) where.companyId = companyId;

  return db.product.findMany({
    where,
    include: { company: true },
    orderBy: { name: "asc" },
    take: 50,
  });
}

export async function getProductStockSummary() {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: { company: true, stockOpenings: true },
    orderBy: { name: "asc" },
  });

  const summaries = await Promise.all(
    products.map(async (product) => {
      // Total openings
      const totalOpenSheets = product.stockOpenings.reduce(
        (sum, o) => sum + toNum(o.sheets),
        0
      );
      const totalOpenCases = product.stockOpenings.reduce(
        (sum, o) => sum + toNum(o.cases),
        0
      );

      // Total movements
      const movements = await db.stockMovement.groupBy({
        by: ["type"],
        where: { productId: product.id },
        _sum: { sheets: true, cases: true },
      });

      let purchaseSheets = 0;
      let purchaseCases = 0;
      let saleSheets = 0;
      let saleCases = 0;

      for (const m of movements) {
        const s = toNum(m._sum.sheets);
        const c = toNum(m._sum.cases);
        if (m.type === "PURCHASE") {
          purchaseSheets += s;
          purchaseCases += c;
        } else if (m.type === "SALE") {
          saleSheets += Math.abs(s);
          saleCases += Math.abs(c);
        }
      }

      const currentSheets = totalOpenSheets + purchaseSheets - saleSheets;
      const currentCases = totalOpenCases + purchaseCases - saleCases;
      const sqmt = calculateSQMT(product.height, product.width, currentSheets);
      const valuation = sqmt * toNum(product.sqmtRate);

      return {
        ...product,
        currentSheets,
        currentCases,
        openingSheets: totalOpenSheets,
        openingCases: totalOpenCases,
        purchaseSheets,
        purchaseCases,
        saleSheets,
        saleCases,
        sqmt,
        sqmtRate: toNum(product.sqmtRate),
        valuation,
      };
    })
  );

  return summaries;
}