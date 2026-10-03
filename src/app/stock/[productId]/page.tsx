import { Shell } from "@/components/layout/shell";
import { getProductDetail } from "@/actions/stock";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { ArrowLeft, Package, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  let detail;
  try {
    detail = await getProductDetail(productId);
  } catch {
    notFound();
  }

  const { product, stock, movements } = detail;

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/stock"
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{product.name}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {product.company.code} — {product.company.name}
            </p>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <h3 className="font-semibold mb-3">Product Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[var(--muted-foreground)]">Code</p>
              <p className="font-mono">{product.code}</p>
            </div>
            <div>
              <p className="text-[var(--muted-foreground)]">Dimensions</p>
              <p className="font-mono">{product.height} × {product.width} cm</p>
            </div>
            <div>
              <p className="text-[var(--muted-foreground)]">Thickness</p>
              <p className="font-mono">{product.thickness} mm</p>
            </div>
            <div>
              <p className="text-[var(--muted-foreground)]">MTR Rate</p>
              <p className="font-mono">{formatCurrency(product.mtrRate)}</p>
            </div>
          </div>
        </div>

        {/* Stock Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
            <p className="text-xs text-[var(--muted-foreground)] mb-1">Opening Stock</p>
            <p className="text-xl font-bold">{formatNumber(stock.openingSheets, 0)}</p>
            <p className="text-xs text-[var(--muted-foreground)]">sheets</p>
          </div>
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
            <p className="text-xs text-[var(--muted-foreground)] mb-1">Current Stock</p>
            <p className="text-xl font-bold">{formatNumber(stock.currentSheets, 0)}</p>
            <p className="text-xs text-[var(--muted-foreground)]">sheets</p>
          </div>
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
            <p className="text-xs text-[var(--muted-foreground)] mb-1">SQMT</p>
            <p className="text-xl font-bold">{formatNumber(stock.sqmt)}</p>
          </div>
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
            <p className="text-xs text-[var(--muted-foreground)] mb-1">Valuation</p>
            <p className="text-xl font-bold">{formatCurrency(stock.valuation)}</p>
            <p className="text-xs text-[var(--muted-foreground)]">@ {formatCurrency(product.sqmtRate)}/sqmt</p>
          </div>
        </div>

        {/* Movement History */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <h3 className="font-semibold mb-4">Stock Movement History</h3>
          {movements.length === 0 ? (
            <p className="text-[var(--muted-foreground)] text-sm py-4">
              No transactions recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left px-3 py-2 font-medium">Date</th>
                    <th className="text-left px-3 py-2 font-medium">Type</th>
                    <th className="text-right px-3 py-2 font-medium">Sheets</th>
                    <th className="text-right px-3 py-2 font-medium">Cases</th>
                    <th className="text-right px-3 py-2 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="px-3 py-2 font-mono text-xs">
                        {formatDate(m.date)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            m.type === "PURCHASE"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                              : m.type === "SALE"
                                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          }`}
                        >
                          {m.type === "PURCHASE" ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {m.type}
                        </span>
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono ${
                          m.sheets > 0 ? "text-emerald-600" : m.sheets < 0 ? "text-red-600" : ""
                        }`}
                      >
                        {m.sheets > 0 ? "+" : ""}
                        {formatNumber(m.sheets, 0)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatNumber(m.cases, 0)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium">
                        {formatNumber(m.runningSheets, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}