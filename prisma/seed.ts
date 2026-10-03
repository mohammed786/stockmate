/**
 * StockMate Seed Script
 *
 * Creates realistic development data based on the Excel workbook structure.
 * Run: npx tsx prisma/seed.ts
 */

import { PrismaClient, MovementType, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding StockMate database...\n");

  // ─── Users ──────────────────────────────────────────────────

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@stockmate.local" },
    update: {},
    create: {
      email: "admin@stockmate.local",
      name: "Admin",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@stockmate.local" },
    update: {},
    create: {
      email: "manager@stockmate.local",
      name: "Manager",
      password: hashedPassword,
      role: Role.MANAGER,
    },
  });

  console.log("✓ Users created");

  // ─── Companies ──────────────────────────────────────────────

  const sgg = await prisma.company.upsert({
    where: { code: "SGG" },
    update: {},
    create: { code: "SGG", name: "Saint-Gobain Glass" },
  });

  const gg = await prisma.company.upsert({
    where: { code: "GG" },
    update: {},
    create: { code: "GG", name: "Gujarat Guardian" },
  });

  const asahi = await prisma.company.upsert({
    where: { code: "ASAHI" },
    update: {},
    create: { code: "ASAHI", name: "Asahi India Glass" },
  });

  console.log("✓ Companies created");

  // ─── Products ───────────────────────────────────────────────

  const productData = [
    // SGG products
    { code: "SGG-3.5MM-CLEAR-108", name: "3.5MM CLEAR 108", companyId: sgg.id, height: 108, width: 244, thickness: 3.5, mtrRate: 105, sqmtRate: 367.5 },
    { code: "SGG-3.5MM-CLEAR-114", name: "3.5MM CLEAR 114", companyId: sgg.id, height: 114, width: 244, thickness: 3.5, mtrRate: 105, sqmtRate: 367.5 },
    { code: "SGG-3.5MM-CLEAR-183", name: "3.5MM CLEAR 183", companyId: sgg.id, height: 183, width: 244, thickness: 3.5, mtrRate: 105, sqmtRate: 367.5 },
    { code: "SGG-3.5MM-CLEAR-2440-1220", name: "3.5MM CLEAR 2440*1220", companyId: sgg.id, height: 122, width: 244, thickness: 3.5, mtrRate: 105, sqmtRate: 367.5 },
    { code: "SGG-3MM-CLEAR-122-244", name: "3MM CLEAR 122*244", companyId: sgg.id, height: 122, width: 244, thickness: 3, mtrRate: 105, sqmtRate: 315 },
    { code: "SGG-4MM-CLEAR-108", name: "4MM CLEAR 108", companyId: sgg.id, height: 108, width: 244, thickness: 4, mtrRate: 105, sqmtRate: 420 },
    { code: "SGG-4MM-CLEAR-2440-1140", name: "4MM CLEAR 2440*1140", companyId: sgg.id, height: 114, width: 244, thickness: 4, mtrRate: 105, sqmtRate: 420 },
    { code: "SGG-4MM-CLEAR-2440-1220", name: "4MM CLEAR 2440*1220", companyId: sgg.id, height: 122, width: 244, thickness: 4, mtrRate: 105, sqmtRate: 420 },
    { code: "SGG-4MM-CLEAR-2440-1380", name: "4MM CLEAR 2440*1380", companyId: sgg.id, height: 138, width: 244, thickness: 4, mtrRate: 105, sqmtRate: 420 },
    { code: "SGG-5MM-CLEAR-114", name: "5MM CLEAR 114", companyId: sgg.id, height: 114, width: 244, thickness: 5, mtrRate: 105, sqmtRate: 525 },
    { code: "SGG-5MM-CLEAR-122", name: "5MM CLEAR 122", companyId: sgg.id, height: 122, width: 244, thickness: 5, mtrRate: 105, sqmtRate: 525 },
    { code: "SGG-5MM-CLEAR-138", name: "5MM CLEAR 138", companyId: sgg.id, height: 138, width: 244, thickness: 5, mtrRate: 105, sqmtRate: 525 },
    { code: "SGG-5MM-CLEAR-183", name: "5MM CLEAR 183", companyId: sgg.id, height: 183, width: 244, thickness: 5, mtrRate: 105, sqmtRate: 525 },
    { code: "SGG-8MM-CLEAR-183", name: "8MM CLEAR 183", companyId: sgg.id, height: 183, width: 244, thickness: 8, mtrRate: 105, sqmtRate: 840 },
    { code: "SGG-10MM-CLEAR-183", name: "10MM CLEAR 183", companyId: sgg.id, height: 183, width: 244, thickness: 10, mtrRate: 105, sqmtRate: 1050 },
    { code: "SGG-12MM-CLEAR-183", name: "12MM CLEAR 183", companyId: sgg.id, height: 183, width: 244, thickness: 12, mtrRate: 105, sqmtRate: 1260 },
    { code: "SGG-4MM-CLEAR-3660-2440", name: "4MM CLEAR 3660*2440", companyId: sgg.id, height: 244, width: 366, thickness: 4, mtrRate: 105, sqmtRate: 420 },
    { code: "SGG-5MM-CLEAR-2440-3660", name: "5MM CLEAR 2440*3660", companyId: sgg.id, height: 244, width: 366, thickness: 5, mtrRate: 105, sqmtRate: 525 },
    { code: "SGG-5MM-MIRROR-122", name: "5MM MIRROR 122", companyId: sgg.id, height: 122, width: 244, thickness: 5, mtrRate: 105, sqmtRate: 525 },
    { code: "SGG-5MM-MIRROR-2140-3050", name: "5MM MIRROR 2140*3050", companyId: sgg.id, height: 214, width: 305, thickness: 5, mtrRate: 105, sqmtRate: 525 },
    { code: "SGG-5MM-PARSOL-GREY-122", name: "5MM PARSOL GREY 122", companyId: sgg.id, height: 122, width: 244, thickness: 5, mtrRate: 105, sqmtRate: 525 },
    { code: "SGG-5MM-PARSOL-GREY-3210-2250", name: "5MM PARSOL GREY 3210*2250", companyId: sgg.id, height: 225, width: 321, thickness: 5, mtrRate: 105, sqmtRate: 525 },
    { code: "SGG-8MM-PARSOL-GREY-3660-2440", name: "8MM PARSOL GREY 3660*2440", companyId: sgg.id, height: 244, width: 366, thickness: 8, mtrRate: 105, sqmtRate: 840 },
    { code: "SGG-3.5MM-BLACK-DIAMOND-3050-2140", name: "3.5MM BLACK Diamond 3050*2140", companyId: sgg.id, height: 214, width: 305, thickness: 3.5, mtrRate: 105, sqmtRate: 367.5 },
    { code: "SGG-3.5MM-BLACK-DIAMOND-2440-1830", name: "3.5MM BLACK Diamond 2440*1830", companyId: sgg.id, height: 183, width: 244, thickness: 3.5, mtrRate: 105, sqmtRate: 367.5 },
    { code: "SGG-4MM-BLACK-DIAMOND-2440-1830", name: "4MM BLACK Diamond 2440*1830", companyId: sgg.id, height: 183, width: 244, thickness: 4, mtrRate: 105, sqmtRate: 420 },
    { code: "SGG-5MM-BLACK-DIAMOND-3660-2440", name: "5MM BLACK Diamond 3660*2440", companyId: sgg.id, height: 244, width: 366, thickness: 5, mtrRate: 105, sqmtRate: 525 },
    { code: "SGG-5MM-BLACK-DIAMOND-3050-2140", name: "5MM BLACK Diamond 3050*2140", companyId: sgg.id, height: 214, width: 305, thickness: 5, mtrRate: 105, sqmtRate: 525 },
    { code: "SGG-5MM-SAPPHIRE-BLUE-3660-2440", name: "5MM SAPPHIRE BLUE 3660*2440", companyId: sgg.id, height: 244, width: 366, thickness: 5, mtrRate: 105, sqmtRate: 525 },
    { code: "SGG-4MM-SAPPHIRE-BLUE-2440-3660", name: "4MM SAPPHIRE BLUE 2440*3660", companyId: sgg.id, height: 244, width: 366, thickness: 4, mtrRate: 105, sqmtRate: 420 },
    // GG products
    { code: "GG-3MM-GREY-GINZA-122", name: "3MM GREY GINZA 122", companyId: gg.id, height: 122, width: 244, thickness: 3, mtrRate: 95, sqmtRate: 285 },
    { code: "GG-3MM-GREY-GINZA-108", name: "3MM GREY GINZA 108", companyId: gg.id, height: 108, width: 244, thickness: 3, mtrRate: 95, sqmtRate: 285 },
    { code: "GG-3MM-GREY-VICTORY-122", name: "3MM GREY VICTORY 122", companyId: gg.id, height: 122, width: 244, thickness: 3, mtrRate: 95, sqmtRate: 285 },
    { code: "GG-4MM-GREY-GINZA-122", name: "4MM GREY GINZA 122", companyId: gg.id, height: 122, width: 244, thickness: 4, mtrRate: 95, sqmtRate: 380 },
    { code: "GG-5MM-GREY-GINZA-2440-3660", name: "5MM GREY GINZA 2440*3660", companyId: gg.id, height: 244, width: 366, thickness: 5, mtrRate: 95, sqmtRate: 475 },
    { code: "GG-5MM-GREY-VICTORY-2440-3660", name: "5MM GREY VICTORY 2440*3660", companyId: gg.id, height: 244, width: 366, thickness: 5, mtrRate: 95, sqmtRate: 475 },
    // ASAHI products
    { code: "ASAHI-4MM-DARK-GREY-2440-1830", name: "4MM DARK GREY 2440*1830", companyId: asahi.id, height: 183, width: 244, thickness: 4, mtrRate: 100, sqmtRate: 400 },
    { code: "ASAHI-3.5MM-DARK-GREY-2440-1140", name: "3.5MM DARK GREY 2440*1140", companyId: asahi.id, height: 114, width: 244, thickness: 3.5, mtrRate: 100, sqmtRate: 350 },
    { code: "ASAHI-3.5MM-DARK-GREY-2440-1830", name: "3.5MM DARK GREY 2440*1830", companyId: asahi.id, height: 183, width: 244, thickness: 3.5, mtrRate: 100, sqmtRate: 350 },
    { code: "ASAHI-4MM-IMPORTED-BLACK-BP", name: "4MM IMPORTED BLACK B.P", companyId: asahi.id, height: 183, width: 244, thickness: 4, mtrRate: 320, sqmtRate: 1280 },
    { code: "ASAHI-DARK-GREY-040-3210-2250", name: "DARK GREY 040-3210*2250", companyId: asahi.id, height: 225, width: 321, thickness: 4, mtrRate: 100, sqmtRate: 400 },
  ];

  for (const p of productData) {
    await prisma.product.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  const allProducts = await prisma.product.findMany();
  console.log(`✓ ${allProducts.length} products created`);

  // ─── Opening Stock (April 2026) ─────────────────────────────

  const openingData: Record<string, number> = {
    "SGG-3.5MM-CLEAR-108": 58,
    "SGG-3.5MM-CLEAR-114": 8,
    "SGG-3.5MM-CLEAR-183": 13,
    "SGG-3.5MM-CLEAR-2440-1220": 74,
    "SGG-3MM-CLEAR-122-244": 117,
    "SGG-4MM-CLEAR-108": 100,
    "SGG-4MM-CLEAR-2440-1140": 121,
    "SGG-4MM-CLEAR-2440-1220": 84,
    "SGG-4MM-CLEAR-2440-1380": 110,
    "SGG-5MM-CLEAR-114": 109,
    "SGG-5MM-CLEAR-122": 87,
    "SGG-5MM-CLEAR-138": 63,
    "SGG-5MM-CLEAR-183": 146,
    "SGG-8MM-CLEAR-183": 107,
    "SGG-10MM-CLEAR-183": 38,
    "SGG-12MM-CLEAR-183": 76,
    "SGG-4MM-CLEAR-3660-2440": 45,
    "SGG-5MM-CLEAR-2440-3660": 50,
    "SGG-5MM-MIRROR-122": 143,
    "SGG-5MM-MIRROR-2140-3050": 31,
    "SGG-5MM-PARSOL-GREY-122": 16,
    "SGG-5MM-PARSOL-GREY-3210-2250": 0,
    "SGG-8MM-PARSOL-GREY-3660-2440": 2,
    "SGG-3.5MM-BLACK-DIAMOND-3050-2140": 28,
    "SGG-3.5MM-BLACK-DIAMOND-2440-1830": 121,
    "SGG-4MM-BLACK-DIAMOND-2440-1830": 71,
    "SGG-5MM-BLACK-DIAMOND-3660-2440": 49,
    "SGG-5MM-BLACK-DIAMOND-3050-2140": 90,
    "SGG-5MM-SAPPHIRE-BLUE-3660-2440": 23,
    "SGG-4MM-SAPPHIRE-BLUE-2440-3660": 37,
    "GG-3MM-GREY-GINZA-122": 42,
    "GG-3MM-GREY-GINZA-108": 18,
    "GG-3MM-GREY-VICTORY-122": 35,
    "GG-4MM-GREY-GINZA-122": 25,
    "GG-5MM-GREY-GINZA-2440-3660": 15,
    "GG-5MM-GREY-VICTORY-2440-3660": 10,
    "ASAHI-4MM-DARK-GREY-2440-1830": 42,
    "ASAHI-3.5MM-DARK-GREY-2440-1140": 28,
    "ASAHI-3.5MM-DARK-GREY-2440-1830": 35,
    "ASAHI-4MM-IMPORTED-BLACK-BP": 0,
    "ASAHI-DARK-GREY-040-3210-2250": 5,
  };

  let openingCount = 0;
  for (const [code, sheets] of Object.entries(openingData)) {
    const product = allProducts.find((p) => p.code === code);
    if (!product) continue;

    await prisma.stockOpening.upsert({
      where: { productId_month_year: { productId: product.id, month: 4, year: 2026 } },
      update: { sheets },
      create: { productId: product.id, month: 4, year: 2026, sheets, cases: 1 },
    });
    openingCount++;
  }

  console.log(`✓ ${openingCount} opening stock records created`);

  // ─── Sample Purchases ───────────────────────────────────────

  const samplePurchases = [
    { date: new Date(2026, 6, 7), items: [
      { code: "SGG-3.5MM-BLACK-DIAMOND-3050-2140", sheets: 42 },
      { code: "SGG-3.5MM-BLACK-DIAMOND-2440-1830", sheets: 108 },
      { code: "SGG-4MM-BLACK-DIAMOND-2440-1830", sheets: 96 },
      { code: "SGG-4MM-CLEAR-3660-2440", sheets: 66 },
      { code: "SGG-5MM-CLEAR-114", sheets: 59 },
      { code: "SGG-5MM-MIRROR-122", sheets: 53 },
      { code: "SGG-12MM-CLEAR-183", sheets: 16 },
      { code: "SGG-8MM-PARSOL-GREY-3660-2440", sheets: 12 },
    ]},
    { date: new Date(2026, 6, 25), items: [
      { code: "SGG-3.5MM-CLEAR-108", sheets: 3 },
    ]},
    { date: new Date(2026, 7, 4), items: [
      { code: "SGG-5MM-PARSOL-GREY-3210-2250", sheets: 26 },
      { code: "SGG-3.5MM-BLACK-DIAMOND-3050-2140", sheets: 42 },
    ]},
    { date: new Date(2026, 7, 8), items: [
      { code: "SGG-5MM-BLACK-DIAMOND-3660-2440", sheets: 24 },
      { code: "SGG-5MM-BLACK-DIAMOND-3050-2140", sheets: 108 },
      { code: "SGG-5MM-SAPPHIRE-BLUE-3660-2440", sheets: 23 },
      { code: "SGG-4MM-SAPPHIRE-BLUE-2440-3660", sheets: 29 },
    ]},
    { date: new Date(2026, 7, 12), items: [
      { code: "SGG-4MM-CLEAR-2440-1830", sheets: 50 },
      { code: "SGG-5MM-CLEAR-138", sheets: 51 },
      { code: "SGG-5MM-MIRROR-2140-3050", sheets: 36 },
    ]},
    { date: new Date(2026, 8, 3), items: [
      { code: "SGG-5MM-CLEAR-122", sheets: 42 },
      { code: "SGG-5MM-CLEAR-183", sheets: 25 },
    ]},
  ];

  let purchaseCount = 0;
  for (const p of samplePurchases) {
    const purchase = await prisma.purchase.create({
      data: { date: p.date, companyId: sgg.id },
    });

    for (const item of p.items) {
      const product = allProducts.find((pr) => pr.code === item.code);
      if (!product) continue;

      await prisma.purchaseItem.create({
        data: { purchaseId: purchase.id, productId: product.id, sheets: item.sheets, cases: 1 },
      });

      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          date: p.date,
          type: MovementType.PURCHASE,
          sheets: item.sheets,
          cases: 1,
          referenceId: purchase.id,
          referenceType: "PURCHASE",
        },
      });
    }
    purchaseCount++;
  }

  console.log(`✓ ${purchaseCount} sample purchases created`);

  // ─── Sample Sales ───────────────────────────────────────────

  const sampleSales = [
    { date: new Date(2026, 7, 5), items: [
      { code: "SGG-5MM-CLEAR-183", sheets: 69 },
    ]},
    { date: new Date(2026, 7, 14), items: [
      { code: "SGG-3.5MM-CLEAR-108", sheets: 25 },
    ]},
    { date: new Date(2026, 8, 2), items: [
      { code: "SGG-4MM-CLEAR-108", sheets: 40 },
      { code: "SGG-5MM-CLEAR-138", sheets: 10 },
    ]},
  ];

  let saleCount = 0;
  for (const s of sampleSales) {
    const sale = await prisma.sale.create({
      data: { date: s.date, companyId: sgg.id, customerName: "Walk-in Customer" },
    });

    for (const item of s.items) {
      const product = allProducts.find((pr) => pr.code === item.code);
      if (!product) continue;

      await prisma.saleItem.create({
        data: { saleId: sale.id, productId: product.id, sheets: item.sheets, cases: 1 },
      });

      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          date: s.date,
          type: MovementType.SALE,
          sheets: -Math.abs(item.sheets),
          cases: -1,
          referenceId: sale.id,
          referenceType: "SALE",
        },
      });
    }
    saleCount++;
  }

  console.log(`✓ ${saleCount} sample sales created`);
  console.log("\n✅ Seed complete!\n");
  console.log("   Login credentials:");
  console.log("   admin@stockmate.local / admin123");
  console.log("   manager@stockmate.local / admin123\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());