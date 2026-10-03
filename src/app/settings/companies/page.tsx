import { Shell } from "@/components/layout/shell";
import { db } from "@/lib/db";
import { Package, Settings, Building2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SettingsCompaniesPage() {
  let companies: { id: string; code: string; name: string; _count?: { products: number } }[] = [];

  try {
    companies = await db.company.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: { code: "asc" },
    });
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

        <div className="flex gap-2 border-b border-[var(--border)]">
          <Link
            href="/settings/products"
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <Package className="h-4 w-4 inline mr-1" />
            Products
          </Link>
          <Link
            href="/settings/companies"
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-[var(--primary)] text-[var(--primary)]"
          >
            <Building2 className="h-4 w-4 inline mr-1" />
            Companies
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.length === 0 ? (
            <div className="col-span-full text-center py-12 text-[var(--muted-foreground)]">
              No companies found. Run the import script to load data.
            </div>
          ) : (
            companies.map((c) => (
              <div key={c.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{c.code}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">{c.name}</p>
                  </div>
                </div>
                <p className="text-sm">
                  <span className="font-mono">{c._count?.products || 0}</span>{" "}
                  product{(c._count?.products || 0) !== 1 ? "s" : ""}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </Shell>
  );
}