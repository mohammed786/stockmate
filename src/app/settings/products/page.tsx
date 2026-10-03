import { Shell } from "@/components/layout/shell";
import { getProducts } from "@/actions/products";
import { db } from "@/lib/db";
import { formatNumber, toNum } from "@/lib/utils";
import Link from "next/link";
import { Package, Settings, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsProductsPage() {
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  let companies: { id: string; code: string; name: string }[] = [];

  try {
    [products, companies] = await Promise.all([
      getProducts(),
      db.company.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    ]);
  } catch {
    // DB not ready
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h1>
        </div>

        {/* Nav tabs */}
        <div className="flex gap-2 border-b border-[var(--border)]">
          <Link
            href="/settings/products"
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-[var(--primary)] text-[var(--primary)]"
          >
            <Package className="h-4 w-4 inline mr-1" />
            Products
          </Link>
          <Link
            href="/settings/companies"
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <Building2 className="h-4 w-4 inline mr-1" />
            Companies
          </Link>
        </div>

        {/* Products List */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="text-left px-4 py-3 font-medium">Code</th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Company</th>
                  <th className="text-right px-4 py-3 font-medium">Dimensions</th>
                  <th className="text-right px-4 py-3 font-medium">Thickness</th>
                  <th className="text-right px-4 py-3 font-medium">MTR Rate</th>
                  <th className="text-right px-4 py-3 font-medium">SQMT Rate</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[var(--muted-foreground)]">
                      No products found. Run the import script to load data.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)]">
                      <td className="px-4 py-2 font-mono text-xs">{p.code}</td>
                      <td className="px-4 py-2 font-medium">{p.name}</td>
                      <td className="px-4 py-2 text-[var(--muted-foreground)]">{p.company.code}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs">
                        {toNum(p.height)}×{toNum(p.width)}cm
                      </td>
                      <td className="px-4 py-2 text-right font-mono">{toNum(p.thickness)}mm</td>
                      <td className="px-4 py-2 text-right font-mono">{formatNumber(toNum(p.mtrRate))}</td>
                      <td className="px-4 py-2 text-right font-mono">{formatNumber(toNum(p.sqmtRate))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}