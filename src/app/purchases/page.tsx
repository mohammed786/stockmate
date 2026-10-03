import { Shell } from "@/components/layout/shell";
import { getPurchases } from "@/actions/purchases";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  let purchases;
  try {
    purchases = await getPurchases();
  } catch {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ShoppingCart className="h-16 w-16 text-[var(--muted-foreground)] mb-4" />
          <h2 className="text-xl font-semibold mb-2">Database Not Connected</h2>
          <p className="text-[var(--muted-foreground)]">
            Run migrations and seed data first.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Purchases</h1>
            <p className="text-[var(--muted-foreground)] text-sm">
              {purchases.length} transaction{purchases.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/purchases/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            New Purchase
          </Link>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {purchases.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted-foreground)]">
              No purchases recorded yet.
              <br />
              <Link href="/purchases/new" className="text-[var(--primary)] underline mt-2 inline-block">
                Create your first purchase →
              </Link>
            </div>
          ) : (
            purchases.map((p) => {
              const totalSheets = p.items.reduce((s, i) => s + Number(i.sheets), 0);
              return (
                <Link
                  key={p.id}
                  href={`/purchases/${p.id}`}
                  className="block bg-[var(--card)] rounded-xl border border-[var(--border)] p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">
                        {p.company?.code || "No Company"}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatDate(p.date)} • {p.items.length} item{p.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      Purchase
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>{formatNumber(totalSheets, 0)} sheets</span>
                    {p.invoiceNo && <span className="text-[var(--muted-foreground)]">Inv: {p.invoiceNo}</span>}
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Company</th>
                  <th className="text-left px-4 py-3 font-medium">Invoice</th>
                  <th className="text-right px-4 py-3 font-medium">Items</th>
                  <th className="text-right px-4 py-3 font-medium">Total Sheets</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-[var(--muted-foreground)]">
                      No purchases recorded yet.
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => {
                    const totalSheets = p.items.reduce((s, i) => s + Number(i.sheets), 0);
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)]"
                      >
                        <td className="px-4 py-3 font-mono text-xs">{formatDate(p.date)}</td>
                        <td className="px-4 py-3">{p.company?.code || "—"}</td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">{p.invoiceNo || "—"}</td>
                        <td className="px-4 py-3 text-right">{p.items.length}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatNumber(totalSheets, 0)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/purchases/${p.id}`} className="text-[var(--primary)] hover:underline text-xs">
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}