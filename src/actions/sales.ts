"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { saleSchema, type SaleInput } from "@/lib/validations";
import { toNum } from "@/lib/utils";
import { validateSufficientStock } from "@/lib/stock";
import { revalidatePath } from "next/cache";

export async function createSale(data: SaleInput) {
  const parsed = saleSchema.parse(data);
  const saleDate = new Date(parsed.date);

  // Validate stock for all items first
  for (const item of parsed.items) {
    if (toNum(item.sheets) === 0 && toNum(item.cases) === 0) continue;

    const check = await validateSufficientStock(
      item.productId,
      toNum(item.sheets),
      toNum(item.cases)
    );

    if (!check.valid) {
      const product = await db.product.findUnique({ where: { id: item.productId } });
      throw new Error(
        `Insufficient stock for ${product?.name || item.productId}. ` +
        `Available: ${check.available.sheets} sheets, ${check.available.cases} cases`
      );
    }
  }

  const result = await db.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        date: saleDate,
        companyId: parsed.companyId || null,
        customerName: parsed.customerName || null,
        invoiceNo: parsed.invoiceNo || null,
        notes: parsed.notes || null,
      },
    });

    for (const item of parsed.items) {
      if (toNum(item.sheets) === 0 && toNum(item.cases) === 0) continue;

      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          sheets: item.sheets,
          cases: item.cases,
          rate: item.rate || null,
        },
      });

      // Record stock movement (negative for sales)
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          date: saleDate,
          type: "SALE",
          sheets: -Math.abs(toNum(item.sheets)),
          cases: -Math.abs(toNum(item.cases)),
          referenceId: sale.id,
          referenceType: "SALE",
        },
      });
    }

    return sale;
  });

  revalidatePath("/sales");
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  return result;
}

export async function getSales(startDate?: Date, endDate?: Date, companyId?: string) {
  const where: Prisma.SaleWhereInput = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }
  if (companyId) where.companyId = companyId;

  return db.sale.findMany({
    where,
    include: {
      company: true,
      items: {
        include: { product: { include: { company: true } } },
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function getSaleById(id: string) {
  return db.sale.findUnique({
    where: { id },
    include: {
      company: true,
      items: {
        include: { product: { include: { company: true } } },
      },
    },
  });
}

export async function deleteSale(id: string) {
  await db.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) throw new Error("Sale not found");

    // Delete related stock movements
    await tx.stockMovement.deleteMany({
      where: { referenceId: id, referenceType: "SALE" },
    });

    await tx.sale.delete({ where: { id } });
  });

  revalidatePath("/sales");
  revalidatePath("/stock");
  revalidatePath("/dashboard");
}

export async function getSaleSummary(startDate?: Date, endDate?: Date) {
  const where: Prisma.SaleWhereInput = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const sales = await db.sale.findMany({
    where,
    include: { items: true },
  });

  let totalSheets = 0;
  let totalCases = 0;
  let totalAmount = 0;

  for (const s of sales) {
    for (const item of s.items) {
      const sheets = toNum(item.sheets);
      const cases = toNum(item.cases);
      totalSheets += sheets;
      totalCases += cases;
      if (item.rate) {
        totalAmount += sheets * toNum(item.rate);
      }
    }
  }

  return {
    count: sales.length,
    totalSheets,
    totalCases,
    totalAmount,
  };
}