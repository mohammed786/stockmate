import { Shell } from "@/components/layout/shell";
import { getSales } from "@/actions/sales";
import { formatNumber, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  let sales;
  try {
    sales = await getSales();
  } catch {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <TrendingDown className="h-16 w-16 text-[var(--muted-foreground)] mb-4" />
          <h2 className="text-xl font-semibold mb-2">Database Not Connected</h2>
          <p className="text-[var(--muted-foreground)]">Run migrations and seed data first.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Sales</h1>
            <p className="text-[var(--muted-foreground)] text-sm">
              {sales.length} transaction{sales.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/sales/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            New Sale
          </Link>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {sales.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted-foreground)]">
              No sales recorded yet.
              <br />
              <Link href="/sales/new" className="text-[var(--primary)] underline mt-2 inline-block">
                Record your first sale →
              </Link>
            </div>
          ) : (
            sales.map((s) => {
              const totalSheets = s.items.reduce((sum, i) => sum + Number(i.sheets), 0);
              return (
                <Link
                  key={s.id}
                  href={`/sales/${s.id}`}
                  className="block bg-[var(--card)] rounded-xl border border-[var(--border)] p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">
                        {s.customerName || s.company?.code || "No Customer"}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatDate(s.date)} • {s.items.length} item{s.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                      Sale
                    </span>
                  </div>
                  <p className="text-sm">{formatNumber(totalSheets, 0)} sheets</p>
                </Link>
              );
            })
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Customer/Company</th>
                <th className="text-left px-4 py-3 font-medium">Invoice</th>
                <th className="text-right px-4 py-3 font-medium">Items</th>
                <th className="text-right px-4 py-3 font-medium">Total Sheets</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--muted-foreground)]">
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                sales.map((s) => {
                  const totalSheets = s.items.reduce((sum, i) => sum + Number(i.sheets), 0);
                  return (
                    <tr key={s.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)]">
                      <td className="px-4 py-3 font-mono text-xs">{formatDate(s.date)}</td>
                      <td className="px-4 py-3">{s.customerName || s.company?.code || "—"}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{s.invoiceNo || "—"}</td>
                      <td className="px-4 py-3 text-right">{s.items.length}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatNumber(totalSheets, 0)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/sales/${s.id}`} className="text-[var(--primary)] hover:underline text-xs">
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
    </Shell>
  );
}