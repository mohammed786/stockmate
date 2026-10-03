import { Shell } from "@/components/layout/shell";
import { getProducts } from "@/actions/products";
import { PurchaseForm } from "@/components/forms/purchase-form";
import { db } from "@/lib/db";
import { toNum } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  let rawProducts: Awaited<ReturnType<typeof getProducts>> = [];
  let companies: { id: string; code: string; name: string }[] = [];

  try {
    [rawProducts, companies] = await Promise.all([
      getProducts(),
      db.company.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    ]);
  } catch {
    // DB not ready
  }

  // Serialize Decimal fields to plain numbers for Client Component
  const products = rawProducts.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    company: { code: p.company.code },
  }));

  return (
    <Shell>
      <PurchaseForm products={products} companies={companies} />
    </Shell>
  );
}