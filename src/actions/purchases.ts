"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { purchaseSchema, type PurchaseInput } from "@/lib/validations";
import { toNum } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function createPurchase(data: PurchaseInput) {
  const parsed = purchaseSchema.parse(data);
  const purchaseDate = new Date(parsed.date);

  // Use a transaction to ensure atomicity
  const result = await db.$transaction(async (tx) => {
    // Create purchase header
    const purchase = await tx.purchase.create({
      data: {
        date: purchaseDate,
        companyId: parsed.companyId || null,
        invoiceNo: parsed.invoiceNo || null,
        notes: parsed.notes || null,
      },
    });

    // Create items and stock movements
    for (const item of parsed.items) {
      if (toNum(item.sheets) === 0 && toNum(item.cases) === 0) continue;

      await tx.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          productId: item.productId,
          sheets: item.sheets,
          cases: item.cases,
          rate: item.rate || null,
        },
      });

      // Record stock movement
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          date: purchaseDate,
          type: "PURCHASE",
          sheets: item.sheets,
          cases: item.cases,
          referenceId: purchase.id,
          referenceType: "PURCHASE",
        },
      });
    }

    return purchase;
  });

  revalidatePath("/purchases");
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  return result;
}

export async function getPurchases(startDate?: Date, endDate?: Date, companyId?: string) {
  const where: Prisma.PurchaseWhereInput = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }
  if (companyId) where.companyId = companyId;

  return db.purchase.findMany({
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

export async function getPurchaseById(id: string) {
  return db.purchase.findUnique({
    where: { id },
    include: {
      company: true,
      items: {
        include: { product: { include: { company: true } } },
      },
    },
  });
}

export async function deletePurchase(id: string) {
  await db.$transaction(async (tx) => {
    // Get purchase items to reverse movements
    const purchase = await tx.purchase.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!purchase) throw new Error("Purchase not found");

    // Delete related stock movements
    await tx.stockMovement.deleteMany({
      where: { referenceId: id, referenceType: "PURCHASE" },
    });

    // Delete purchase (cascade deletes items)
    await tx.purchase.delete({ where: { id } });
  });

  revalidatePath("/purchases");
  revalidatePath("/stock");
  revalidatePath("/dashboard");
}

export async function getPurchaseSummary(startDate?: Date, endDate?: Date) {
  const where: Prisma.PurchaseWhereInput = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const purchases = await db.purchase.findMany({
    where,
    include: { items: true },
  });

  let totalSheets = 0;
  let totalCases = 0;
  let totalAmount = 0;

  for (const p of purchases) {
    for (const item of p.items) {
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
    count: purchases.length,
    totalSheets,
    totalCases,
    totalAmount,
  };
}