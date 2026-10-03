/**
 * StockMate Excel Import Script
 *
 * Reads STOCK REPORT 26-27.xlsx and imports data into PostgreSQL.
 * Handles: products, companies, opening stock, monthly transactions.
 *
 * Usage: npx tsx scripts/import-excel.ts [path-to-xlsx]
 */

import { PrismaClient, MovementType } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";

const prisma = new PrismaClient();

interface ImportResult {
  companies: number;
  products: number;
  openings: number;
  purchases: number;
  sales: number;
  warnings: string[];
  errors: string[];
}

interface ParsedProduct {
  sr: number;
  companyCode: string;
  name: string;
  sheets: number;
  height: number;
  width: number;
  sizeDivisor: number;
  qtyPcs: number;
  sqmt: number;
  thickness: number;
  mtrRate: number;
  sqmtRate: number;
  amount: number;
}

interface DailyTransaction {
  date: Date;
  purchaseSheets: number;
  purchaseCases: number;
  saleSheets: number;
  saleCases: number;
}

interface MonthlyProductData {
  companyCode: string;
  name: string;
  openingSheets: number;
  openingCases: number;
  onHandSheets: number;
  onHandCases: number;
  dailyTransactions: DailyTransaction[];
}

function generateProductCode(companyCode: string, name: string): string {
  const clean = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${companyCode}-${clean}`;
}

function parseDate(dateStr: string, monthYear: string): Date | null {
  // dateStr like "01-04-26" or "11/04/26"
  // monthYear like "APRIL-26" or "Aug-26"
  if (!dateStr || typeof dateStr !== "string") return null;

  const cleaned = String(dateStr).trim();
  const parts = cleaned.split(/[-\/]/);
  if (parts.length < 2) return null;

  const day = parseInt(parts[0], 10);
  if (isNaN(day) || day < 1 || day > 31) return null;

  // Extract month and year from sheet name
  const monthMap: Record<string, number> = {
    "JANUARY": 1, "FEBRUARY": 2, "MARCH": 3, "APRIL": 4,
    "MAY": 5, "JUNE": 6, "JULY": 7, "AUGUST": 8,
    "SEPTEMBER": 9, "OCTOBER": 10, "NOVEMBER": 11, "DECEMBER": 12,
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4,
    "JUN": 6, "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
  };

  const nameParts = monthYear.split("-");
  const monthStr = nameParts[0].toUpperCase();
  const yearStr = nameParts[1];

  const month = monthMap[monthStr];
  if (!month) return null;

  let year = parseInt(yearStr, 10);
  if (year < 100) year += 2000;

  return new Date(year, month - 1, day);
}

function getMonthFromSheetName(sheetName: string): { month: number; year: number } | null {
  const monthMap: Record<string, number> = {
    "JANUARY": 1, "FEBRUARY": 2, "MARCH": 3, "APRIL": 4,
    "MAY": 5, "JUNE": 6, "JULY": 7, "AUGUST": 8,
    "SEPTEMBER": 9, "OCTOBER": 10, "NOVEMBER": 11, "DECEMBER": 12,
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4,
    "JUN": 6, "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
  };

  const parts = sheetName.split("-");
  const monthStr = parts[0].toUpperCase();
  const yearStr = parts[1];

  const month = monthMap[monthStr];
  if (!month) return null;

  let year = parseInt(yearStr, 10);
  if (year < 100) year += 2000;

  return { month, year };
}

function parseCalcSheet(rows: any[][]): ParsedProduct[] {
  const products: ParsedProduct[] = [];

  // Skip header rows (0=title, 1=header)
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;

    const sr = row[0];
    const companyCode = row[1];
    const name = row[2];

    // Skip total/summary rows
    if (!companyCode || !name) continue;
    const nameStr = String(name).toUpperCase().trim();
    if (nameStr === "TOTAL" || nameStr.includes("CLOSING") || nameStr.includes("STOCK CALCULATION")) continue;

    const sheets = parseFloat(row[3]) || 0;
    const height = parseFloat(row[4]) || 0;
    const width = parseFloat(row[5]) || 0;
    const sizeDivisor = parseFloat(row[6]) || 10000;
    const qtyPcs = parseFloat(row[7]) || 0;
    const sqmt = parseFloat(row[8]) || 0;
    const thickness = parseFloat(row[9]) || 0;
    const mtrRate = parseFloat(row[10]) || 0;
    const sqmtRate = parseFloat(row[11]) || 0;
    const amount = parseFloat(row[12]) || 0;

    if (!companyCode || !name || height === 0) continue;

    products.push({
      sr: typeof sr === "number" ? sr : parseInt(String(sr)) || 0,
      companyCode: String(companyCode).trim(),
      name: String(name).trim(),
      sheets,
      height,
      width,
      sizeDivisor,
      qtyPcs,
      sqmt,
      thickness,
      mtrRate,
      sqmtRate,
      amount,
    });
  }

  return products;
}

function parseMonthlySheet(
  rows: any[][],
  sheetName: string
): MonthlyProductData[] {
  const products: MonthlyProductData[] = [];

  if (rows.length < 4) return products;

  // Row 0: title with dates
  // Row 1: headers (PURCHASE/SALE)
  // Row 2: sub-headers (SHEET/CASE)
  // Row 3+: data

  // Parse date columns from row 0
  const dateColumns: { col: number; date: Date }[] = [];
  const row0 = rows[0] || [];

  // Dates start at column 9, every 5 columns
  for (let j = 9; j < row0.length; j += 5) {
    if (row0[j]) {
      const date = parseDate(String(row0[j]), sheetName);
      if (date) {
        dateColumns.push({ col: j, date });
      }
    }
  }

  // Parse product rows
  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row[0] == null) continue;

    const companyCode = row[1] ? String(row[1]).trim() : "";
    const name = row[2] ? String(row[2]).trim() : "";

    // Skip total/summary rows
    if (!name || name.toUpperCase() === "TOTAL") continue;
    if (!companyCode) continue;

    const openingSheets = parseFloat(row[6]) || 0;
    const openingCases = parseFloat(row[7]) || 0;
    const onHandSheets = parseFloat(row[3]) || 0;
    const onHandCases = parseFloat(row[4]) || 0;

    // Parse daily transactions
    const dailyTransactions: DailyTransaction[] = [];
    for (const { col, date } of dateColumns) {
      const purchaseSheets = parseFloat(row[col]) || 0;
      const purchaseCases = parseFloat(row[col + 1]) || 0;
      const saleSheets = parseFloat(row[col + 2]) || 0;
      const saleCases = parseFloat(row[col + 3]) || 0;

      if (purchaseSheets > 0 || purchaseCases > 0 || saleSheets > 0 || saleCases > 0) {
        dailyTransactions.push({
          date,
          purchaseSheets,
          purchaseCases,
          saleSheets,
          saleCases,
        });
      }
    }

    products.push({
      companyCode,
      name,
      openingSheets,
      openingCases,
      onHandSheets,
      onHandCases,
      dailyTransactions,
    });
  }

  return products;
}

async function importWorkbook(filePath: string): Promise<ImportResult> {
  const result: ImportResult = {
    companies: 0,
    products: 0,
    openings: 0,
    purchases: 0,
    sales: 0,
    warnings: [],
    errors: [],
  };

  console.log(`\n📊 Reading workbook: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  console.log(`   Found ${sheetNames.length} sheets: ${sheetNames.join(", ")}`);

  // Separate calc sheets and monthly sheets
  const calcSheetNames = sheetNames.filter((n) => n.toUpperCase().startsWith("CALC"));
  const monthlySheetNames = sheetNames.filter(
    (n) => !n.toUpperCase().startsWith("CALC") && n.toUpperCase() !== "STOCK CALCULATION"
  );

  console.log(`\n📋 Calc sheets: ${calcSheetNames.join(", ")}`);
  console.log(`📅 Monthly sheets: ${monthlySheetNames.join(", ")}`);

  // Step 1: Parse all CALC sheets to get product master data
  console.log("\n━━━ Step 1: Parsing product master data from CALC sheets ━━━");

  const allProducts = new Map<string, ParsedProduct>();
  const companyCodes = new Set<string>();

  for (const calcName of calcSheetNames) {
    const sheet = workbook.Sheets[calcName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const products = parseCalcSheet(rows);

    console.log(`   ${calcName}: ${products.length} products found`);

    for (const p of products) {
      companyCodes.add(p.companyCode);
      const key = generateProductCode(p.companyCode, p.name);
      // Use latest CALC sheet data (they may update rates)
      allProducts.set(key, p);
    }
  }

  console.log(`\n   Total unique products: ${allProducts.size}`);
  console.log(`   Companies: ${[...companyCodes].join(", ")}`);

  // Step 2: Create companies
  console.log("\n━━━ Step 2: Creating companies ━━━");

  const companyNames: Record<string, string> = {
    SGG: "Saint-Gobain Glass",
    GG: "Gujarat Guardian",
    ASAHI: "Asahi India Glass",
  };

  const companyMap = new Map<string, string>();

  for (const code of companyCodes) {
    const company = await prisma.company.upsert({
      where: { code },
      update: { name: companyNames[code] || code },
      create: {
        code,
        name: companyNames[code] || code,
      },
    });
    companyMap.set(code, company.id);
    result.companies++;
    console.log(`   ✓ ${code} → ${company.name}`);
  }

  // Step 3: Create products
  console.log("\n━━━ Step 3: Creating products ━━━");

  const productMap = new Map<string, string>();

  for (const [code, p] of allProducts) {
    const companyId = companyMap.get(p.companyCode);
    if (!companyId) {
      result.errors.push(`Company not found for code: ${p.companyCode}`);
      continue;
    }

    const product = await prisma.product.upsert({
      where: { code },
      update: {
        name: p.name,
        height: p.height,
        width: p.width,
        thickness: p.thickness,
        mtrRate: p.mtrRate,
        sqmtRate: p.sqmtRate,
      },
      create: {
        code,
        name: p.name,
        companyId,
        height: p.height,
        width: p.width,
        thickness: p.thickness,
        mtrRate: p.mtrRate,
        sqmtRate: p.sqmtRate,
      },
    });
    productMap.set(code, product.id);
    result.products++;
  }

  console.log(`   ✓ ${result.products} products created/updated`);

  // Step 4: Parse monthly sheets and import transactions
  console.log("\n━━━ Step 4: Importing monthly transactions ━━━");

  for (const monthName of monthlySheetNames) {
    const monthInfo = getMonthFromSheetName(monthName);
    if (!monthInfo) {
      result.warnings.push(`Cannot parse month from sheet name: ${monthName}`);
      continue;
    }

    const sheet = workbook.Sheets[monthName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const monthlyData = parseMonthlySheet(rows, monthName);

    console.log(`\n   ${monthName}: ${monthlyData.length} products with data`);

    let monthPurchases = 0;
    let monthSales = 0;
    let monthOpenings = 0;

    for (const data of monthlyData) {
      const code = generateProductCode(data.companyCode, data.name);
      const productId = productMap.get(code);

      if (!productId) {
        result.warnings.push(`Product not found: ${code} (from ${monthName})`);
        continue;
      }

      // Create opening stock record
      if (data.openingSheets > 0 || data.openingCases > 0) {
        await prisma.stockOpening.upsert({
          where: {
            productId_month_year: {
              productId,
              month: monthInfo.month,
              year: monthInfo.year,
            },
          },
          update: {
            sheets: data.openingSheets,
            cases: data.openingCases,
          },
          create: {
            productId,
            month: monthInfo.month,
            year: monthInfo.year,
            sheets: data.openingSheets,
            cases: data.openingCases,
          },
        });
        monthOpenings++;
      }

      // Import daily transactions
      for (const tx of data.dailyTransactions) {
        if (tx.purchaseSheets > 0 || tx.purchaseCases > 0) {
          // Create purchase
          const purchase = await prisma.purchase.create({
            data: {
              date: tx.date,
            },
          });

          await prisma.purchaseItem.create({
            data: {
              purchaseId: purchase.id,
              productId,
              sheets: tx.purchaseSheets,
              cases: tx.purchaseCases,
            },
          });

          await prisma.stockMovement.create({
            data: {
              productId,
              date: tx.date,
              type: MovementType.PURCHASE,
              sheets: tx.purchaseSheets,
              cases: tx.purchaseCases,
              referenceId: purchase.id,
              referenceType: "PURCHASE",
            },
          });

          monthPurchases++;
        }

        if (tx.saleSheets > 0 || tx.saleCases > 0) {
          const sale = await prisma.sale.create({
            data: { date: tx.date },
          });

          await prisma.saleItem.create({
            data: {
              saleId: sale.id,
              productId,
              sheets: tx.saleSheets,
              cases: tx.saleCases,
            },
          });

          await prisma.stockMovement.create({
            data: {
              productId,
              date: tx.date,
              type: MovementType.SALE,
              sheets: -Math.abs(tx.saleSheets),
              cases: -Math.abs(tx.saleCases),
              referenceId: sale.id,
              referenceType: "SALE",
            },
          });

          monthSales++;
        }
      }
    }

    result.openings += monthOpenings;
    result.purchases += monthPurchases;
    result.sales += monthSales;

    console.log(`   ✓ Openings: ${monthOpenings}, Purchases: ${monthPurchases}, Sales: ${monthSales}`);
  }

  // Step 5: Reconciliation
  console.log("\n━━━ Step 5: Data Reconciliation ━━━");

  const lastCalcName = calcSheetNames[calcSheetNames.length - 1];
  if (lastCalcName) {
    const sheet = workbook.Sheets[lastCalcName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const calcProducts = parseCalcSheet(rows);

    let matchCount = 0;
    let mismatchCount = 0;

    for (const calcP of calcProducts) {
      const code = generateProductCode(calcP.companyCode, calcP.name);
      const productId = productMap.get(code);
      if (!productId) continue;

      // Calculate DB stock from movements
      const movements = await prisma.stockMovement.groupBy({
        by: ["type"],
        where: { productId },
        _sum: { sheets: true, cases: true },
      });

      const openings = await prisma.stockOpening.findMany({ where: { productId } });
      const totalOpen = openings.reduce((s, o) => s + Number(o.sheets), 0);

      let purchaseS = 0;
      let saleS = 0;
      for (const m of movements) {
        const val = Number(m._sum.sheets || 0);
        if (m.type === "PURCHASE") purchaseS += val;
        else if (m.type === "SALE") saleS += Math.abs(val);
      }

      const dbClosing = totalOpen + purchaseS - saleS;
      const excelClosing = calcP.sheets;
      const diff = Math.abs(dbClosing - excelClosing);

      if (diff > 0.01) {
        mismatchCount++;
        if (mismatchCount <= 20) {
          result.warnings.push(
            `MISMATCH: ${code} — Excel: ${excelClosing}, DB: ${dbClosing}, Diff: ${(dbClosing - excelClosing).toFixed(2)}`
          );
        }
      } else {
        matchCount++;
      }
    }

    console.log(`   ✓ Matched: ${matchCount}`);
    if (mismatchCount > 0) {
      console.log(`   ⚠ Mismatched: ${mismatchCount}`);
      if (mismatchCount > 20) {
        result.warnings.push(`... and ${mismatchCount - 20} more mismatches`);
      }
    }
  }

  return result;
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  const filePath = process.argv[2] || path.join(__dirname, "..", "STOCK REPORT 26-27.xlsx");

  console.log("╔═══════════════════════════════════════╗");
  console.log("║    StockMate Excel Import             ║");
  console.log("╚═══════════════════════════════════════╝");

  try {
    const result = await importWorkbook(filePath);

    console.log("\n╔═══════════════════════════════════════╗");
    console.log("║           Import Summary               ║");
    console.log("╚═══════════════════════════════════════╝");
    console.log(`\n  Companies:  ${result.companies}`);
    console.log(`  Products:   ${result.products}`);
    console.log(`  Openings:   ${result.openings}`);
    console.log(`  Purchases:  ${result.purchases}`);
    console.log(`  Sales:      ${result.sales}`);

    if (result.warnings.length > 0) {
      console.log(`\n  ⚠ Warnings (${result.warnings.length}):`);
      for (const w of result.warnings) {
        console.log(`    - ${w}`);
      }
    }

    if (result.errors.length > 0) {
      console.log(`\n  ✗ Errors (${result.errors.length}):`);
      for (const e of result.errors) {
        console.log(`    - ${e}`);
      }
    }

    console.log("\n✅ Import complete!");
  } catch (error) {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();