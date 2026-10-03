import { Shell } from "@/components/layout/shell";
import { getDashboardStats } from "@/actions/stock";
import { formatCurrency, formatNumber, getMonthName, getCurrentFY } from "@/lib/utils";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  IndianRupee,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let stats;
  try {
    stats = await getDashboardStats();
  } catch {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Package className="h-16 w-16 text-[var(--muted-foreground)] mb-4" />
          <h2 className="text-xl font-semibold mb-2">Database Not Connected</h2>
          <p className="text-[var(--muted-foreground)] max-w-md">
            Please set up your database and run migrations first.
            <br />
            Check the README for setup instructions.
          </p>
        </div>
      </Shell>
    );
  }

  const fy = getCurrentFY();
  const month = getMonthName(new Date().getMonth() + 1);

  const statCards = [
    {
      label: "Total Products",
      value: stats.productCount,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Current Stock (Sheets)",
      value: formatNumber(stats.totalSheets, 0),
      icon: Boxes,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      label: "Total SQMT",
      value: formatNumber(stats.totalSQMT),
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950",
    },
    {
      label: "Stock Valuation",
      value: formatCurrency(stats.totalValuation),
      icon: IndianRupee,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
  ];

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-[var(--muted-foreground)]">
            FY {fy.label} — {month} {new Date().getFullYear()}
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 md:p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Monthly Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpRight className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold">Purchases This Month</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{stats.monthlyPurchaseCount}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Transactions</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(stats.monthlyPurchaseSheets, 0)}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Sheets</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold">Sales This Month</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{stats.monthlySaleCount}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Transactions</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(stats.monthlySaleSheets, 0)}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Sheets</p>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {stats.lowStockCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                Low Stock Alert
              </h3>
            </div>
            <p className="text-amber-700 dark:text-amber-300">
              {stats.lowStockCount} product{stats.lowStockCount !== 1 ? "s have" : " has"} low stock (≤ 10 sheets).
              {" "}
              <a href="/stock?status=low-stock" className="underline font-medium">
                View items →
              </a>
            </p>
          </div>
        )}

        {/* Recent Movements */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <h3 className="font-semibold mb-4">Recent Stock Movements</h3>
          {stats.recentMovements.length === 0 ? (
            <p className="text-[var(--muted-foreground)] text-sm">No recent movements.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div>
                    <span className="font-medium text-sm">{m.productName}</span>
                    <span className="text-xs text-[var(--muted-foreground)] ml-2">
                      {m.companyCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-mono font-medium ${
                        m.type === "PURCHASE" ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {m.type === "PURCHASE" ? "+" : ""}
                      {formatNumber(m.sheets, 0)} sheets
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.type === "PURCHASE"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {m.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}