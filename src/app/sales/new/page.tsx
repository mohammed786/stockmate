import { Shell } from "@/components/layout/shell";
import { getProducts } from "@/actions/products";
import { SaleForm } from "@/components/forms/sale-form";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
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
      <SaleForm products={products} companies={companies} />
    </Shell>
  );
}