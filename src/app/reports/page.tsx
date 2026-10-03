import { Shell } from "@/components/layout/shell";
import { getProductStockSummary } from "@/actions/products";
import { getPurchases } from "@/actions/purchases";
import { getSales } from "@/actions/sales";
import { formatCurrency, formatNumber, formatDate, toNum } from "@/lib/utils";
import { BarChart3, Download } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  let stockData: Awaited<ReturnType<typeof getProductStockSummary>> = [];
  let purchases: Awaited<ReturnType<typeof getPurchases>> = [];
  let salesList: Awaited<ReturnType<typeof getSales>> = [];

  try {
    [stockData, purchases, salesList] = await Promise.all([
      getProductStockSummary(),
      getPurchases(),
      getSales(),
    ]);
  } catch {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <BarChart3 className="h-16 w-16 text-[var(--muted-foreground)] mb-4" />
          <h2 className="text-xl font-semibold mb-2">Database Not Connected</h2>
          <p className="text-[var(--muted-foreground)]">Run migrations and seed data first.</p>
        </div>
      </Shell>
    );
  }

  // Aggregate by company
  const companyStats = new Map<string, {
    code: string;
    name: string;
    products: number;
    totalSheets: number;
    totalSQMT: number;
    totalValuation: number;
  }>();

  for (const item of stockData) {
    const key = item.company.code;
    if (!companyStats.has(key)) {
      companyStats.set(key, {
        code: item.company.code,
        name: item.company.name,
        products: 0,
        totalSheets: 0,
        totalSQMT: 0,
        totalValuation: 0,
      });
    }
    const stat = companyStats.get(key)!;
    stat.products++;
    stat.totalSheets += item.currentSheets;
    stat.totalSQMT += item.sqmt;
    stat.totalValuation += item.valuation;
  }

  // Stock status breakdown
  const inStock = stockData.filter((s) => s.currentSheets > 10).length;
  const lowStock = stockData.filter((s) => s.currentSheets > 0 && s.currentSheets <= 10).length;
  const outOfStock = stockData.filter((s) => s.currentSheets <= 0).length;

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-[var(--muted-foreground)] text-sm">
            Stock analysis and business reports
          </p>
        </div>

        {/* Company-wise Summary */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <h3 className="font-semibold mb-4">Company-wise Stock Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-3 py-2 font-medium">Company</th>
                  <th className="text-right px-3 py-2 font-medium">Products</th>
                  <th className="text-right px-3 py-2 font-medium">Stock (Sheets)</th>
                  <th className="text-right px-3 py-2 font-medium">SQMT</th>
                  <th className="text-right px-3 py-2 font-medium">Valuation</th>
                </tr>
              </thead>
              <tbody>
                {[...companyStats.values()].map((stat) => (
                  <tr key={stat.code} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-3 py-2 font-medium">{stat.code} — {stat.name}</td>
                    <td className="px-3 py-2 text-right font-mono">{stat.products}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatNumber(stat.totalSheets, 0)}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatNumber(stat.totalSQMT)}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatCurrency(stat.totalValuation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/stock?status=in-stock" className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 hover:bg-[var(--accent)]">
            <p className="text-sm text-[var(--muted-foreground)]">In Stock (&gt;10)</p>
            <p className="text-2xl font-bold text-emerald-600">{inStock}</p>
          </Link>
          <Link href="/stock?status=low-stock" className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 hover:bg-[var(--accent)]">
            <p className="text-sm text-[var(--muted-foreground)]">Low Stock (1–10)</p>
            <p className="text-2xl font-bold text-amber-600">{lowStock}</p>
          </Link>
          <Link href="/stock?status=out-of-stock" className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 hover:bg-[var(--accent)]">
            <p className="text-sm text-[var(--muted-foreground)]">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
          </Link>
        </div>

        {/* Transaction Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
            <h3 className="font-semibold mb-3">Purchase Summary</h3>
            <p className="text-2xl font-bold">{purchases.length}</p>
            <p className="text-sm text-[var(--muted-foreground)]">Total transactions</p>
            <div className="mt-3 space-y-1">
              {purchases.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between text-xs">
                  <span>{formatDate(p.date)}</span>
                  <span className="font-mono">{p.items.length} items</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
            <h3 className="font-semibold mb-3">Sales Summary</h3>
            <p className="text-2xl font-bold">{salesList.length}</p>
            <p className="text-sm text-[var(--muted-foreground)]">Total transactions</p>
            <div className="mt-3 space-y-1">
              {salesList.slice(0, 5).map((s) => (
                <div key={s.id} className="flex justify-between text-xs">
                  <span>{formatDate(s.date)}</span>
                  <span className="font-mono">{s.items.length} items</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products by Valuation */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <h3 className="font-semibold mb-4">Top Products by Valuation</h3>
          <div className="space-y-2">
            {stockData
              .sort((a, b) => b.valuation - a.valuation)
              .slice(0, 10)
              .map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--muted-foreground)] w-6">{idx + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{item.company.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">{formatCurrency(item.valuation)}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatNumber(item.sqmt)} sqmt</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}