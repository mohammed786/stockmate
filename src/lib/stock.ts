import { Decimal } from "@prisma/client/runtime/library";
import { db } from "./db";
import { toNum } from "./utils";

// ─── SQMT Calculation ───────────────────────────────────────

/**
 * Calculate SQMT from dimensions and quantity.
 * Formula: SQMT = (height_cm × width_cm × quantity) / 10000
 *
 * Source: CALC sheets in workbook — verified with multiple products.
 * Example: 3.5MM CLEAR 108 → 108 × 244 × 58 / 10000 = 152.8416
 */
export function calculateSQMT(
  heightCm: number | Decimal,
  widthCm: number | Decimal,
  quantity: number | Decimal
): number {
  const h = toNum(heightCm);
  const w = toNum(widthCm);
  const q = toNum(quantity);
  return (h * w * q) / 10000;
}

/**
 * Calculate SQMT Rate from MTR Rate and thickness.
 * Formula: SQMT_RATE = MTR_RATE × thickness_mm
 *
 * Source: CALC sheets — verified: MTR=95, THICK=3.5 → SQMT_RATE=332.5
 */
export function calculateSQMTRate(
  mtrRate: number | Decimal,
  thicknessMm: number | Decimal
): number {
  return toNum(mtrRate) * toNum(thicknessMm);
}

/**
 * Calculate stock valuation.
 * Formula: AMOUNT = SQMT × SQMT_RATE
 */
export function calculateValuation(
  sqmt: number | Decimal,
  sqmtRate: number | Decimal
): number {
  return toNum(sqmt) * toNum(sqmtRate);
}

// ─── Stock Balance ──────────────────────────────────────────

export interface StockBalance {
  productId: string;
  openingSheets: number;
  openingCases: number;
  purchaseSheets: number;
  purchaseCases: number;
  saleSheets: number;
  saleCases: number;
  closingSheets: number;
  closingCases: number;
  sqmt: number;
  sqmtRate: number;
  valuation: number;
}

/**
 * Calculate stock balance for a product within a date range.
 * Uses the stock_movements ledger for accurate calculation.
 *
 * Closing = Opening + Purchases - Sales + Adjustments
 */
export async function calculateStockBalance(
  productId: string,
  startDate: Date,
  endDate: Date
): Promise<StockBalance> {
  // Get opening stock
  const month = startDate.getMonth() + 1;
  const year = startDate.getFullYear();

  const opening = await db.stockOpening.findUnique({
    where: { productId_month_year: { productId, month, year } },
  });

  const openingSheets = opening ? toNum(opening.sheets) : 0;
  const openingCases = opening ? toNum(opening.cases) : 0;

  // Get movements within date range
  const movements = await db.stockMovement.findMany({
    where: {
      productId,
      date: { gte: startDate, lte: endDate },
    },
  });

  let purchaseSheets = 0;
  let purchaseCases = 0;
  let saleSheets = 0;
  let saleCases = 0;
  let adjustmentSheets = 0;
  let adjustmentCases = 0;

  for (const m of movements) {
    const s = toNum(m.sheets);
    const c = toNum(m.cases);
    switch (m.type) {
      case "PURCHASE":
        purchaseSheets += s;
        purchaseCases += c;
        break;
      case "SALE":
        saleSheets += Math.abs(s);
        saleCases += Math.abs(c);
        break;
      case "ADJUSTMENT":
      case "RETURN":
        adjustmentSheets += s;
        adjustmentCases += c;
        break;
      case "DAMAGE":
        adjustmentSheets -= Math.abs(s);
        adjustmentCases -= Math.abs(c);
        break;
    }
  }

  const closingSheets = openingSheets + purchaseSheets - saleSheets + adjustmentSheets;
  const closingCases = openingCases + purchaseCases - saleCases + adjustmentCases;

  // Get product for SQMT calculation
  const product = await db.product.findUnique({ where: { id: productId } });
  const sqmt = product ? calculateSQMT(product.height, product.width, closingSheets) : 0;
  const sqmtRate = product ? toNum(product.sqmtRate) : 0;
  const valuation = calculateValuation(sqmt, sqmtRate);

  return {
    productId,
    openingSheets,
    openingCases,
    purchaseSheets,
    purchaseCases,
    saleSheets,
    saleCases,
    closingSheets,
    closingCases,
    sqmt,
    sqmtRate,
    valuation,
  };
}

/**
 * Get current stock for a product (all-time from movements + opening)
 */
export async function getCurrentStock(productId: string): Promise<{
  sheets: number;
  cases: number;
  sqmt: number;
  valuation: number;
}> {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { sheets: 0, cases: 0, sqmt: 0, valuation: 0 };

  // Get all openings
  const openings = await db.stockOpening.findMany({
    where: { productId },
  });
  const totalOpenSheets = openings.reduce((sum, o) => sum + toNum(o.sheets), 0);
  const totalOpenCases = openings.reduce((sum, o) => sum + toNum(o.cases), 0);

  // Get all movements
  const movements = await db.stockMovement.findMany({
    where: { productId },
  });

  let netSheets = 0;
  let netCases = 0;
  for (const m of movements) {
    netSheets += toNum(m.sheets);
    netCases += toNum(m.cases);
  }

  const sheets = totalOpenSheets + netSheets;
  const cases = totalOpenCases + netCases;
  const sqmt = calculateSQMT(product.height, product.width, sheets);
  const valuation = calculateValuation(sqmt, product.sqmtRate);

  return { sheets, cases, sqmt, valuation };
}

/**
 * Validate that a sale won't result in negative stock.
 */
export async function validateSufficientStock(
  productId: string,
  requiredSheets: number,
  requiredCases: number
): Promise<{ valid: boolean; available: { sheets: number; cases: number } }> {
  const current = await getCurrentStock(productId);
  return {
    valid: current.sheets >= requiredSheets && current.cases >= requiredCases,
    available: { sheets: current.sheets, cases: current.cases },
  };
}

/**
 * Get stock movement history for a product
 */
export async function getStockMovements(
  productId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: Parameters<typeof db.stockMovement.findMany>[0]["where"] = {
    productId,
  };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  return db.stockMovement.findMany({
    where,
    orderBy: { date: "asc" },
    include: { product: { select: { name: true, code: true } } },
  });
}

/**
 * Reconstruct stock at a point in time from movements.
 * Useful for historical reporting and reconciliation.
 */
export async function getStockAsOfDate(
  productId: string,
  asOfDate: Date
): Promise<{ sheets: number; cases: number }> {
  // Get all openings up to the month
  const openings = await db.stockOpening.findMany({
    where: {
      productId,
      OR: [
        { year: { lt: asOfDate.getFullYear() } },
        {
          year: asOfDate.getFullYear(),
          month: { lte: asOfDate.getMonth() + 1 },
        },
      ],
    },
  });

  const totalOpenSheets = openings.reduce((sum, o) => sum + toNum(o.sheets), 0);
  const totalOpenCases = openings.reduce((sum, o) => sum + toNum(o.cases), 0);

  // Get all movements up to date
  const movements = await db.stockMovement.findMany({
    where: {
      productId,
      date: { lte: asOfDate },
    },
  });

  let netSheets = 0;
  let netCases = 0;
  for (const m of movements) {
    netSheets += toNum(m.sheets);
    netCases += toNum(m.cases);
  }

  return {
    sheets: totalOpenSheets + netSheets,
    cases: totalOpenCases + netCases,
  };
}