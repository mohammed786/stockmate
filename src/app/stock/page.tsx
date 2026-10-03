import { Shell } from "@/components/layout/shell";
import { getStockReport, type StockRow } from "@/actions/stock";
import { db } from "@/lib/db";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { StockFilters } from "@/components/stock/stock-filters";
import { Package, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  let companies: { id: string; code: string; name: string }[] = [];
  try {
    companies = await db.company.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });
  } catch {
    // DB not ready
  }

  let result: { data: StockRow[]; total: number; page: number; totalPages: number };
  try {
    result = await getStockReport({
      search: typeof params.q === "string" ? params.q : undefined,
      companyId: typeof params.company === "string" ? params.company : undefined,
      stockStatus: typeof params.status === "string" ? (params.status as StockRow extends never ? string : "all" | "in-stock" | "low-stock" | "out-of-stock") : undefined,
      sortBy: typeof params.sort === "string" ? (params.sort as "name" | "company" | "sheets" | "sqmt" | "valuation") : undefined,
      sortOrder: typeof params.order === "string" ? (params.order as "asc" | "desc") : undefined,
      page: typeof params.page === "string" ? parseInt(params.page) : 1,
      pageSize: typeof params.size === "string" ? parseInt(params.size) : 50,
    });
  } catch {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Package className="h-16 w-16 text-[var(--muted-foreground)] mb-4" />
          <h2 className="text-xl font-semibold mb-2">Database Not Connected</h2>
          <p className="text-[var(--muted-foreground)]">
            Run migrations and seed data first. See README for instructions.
          </p>
        </div>
      </Shell>
    );
  }

  const { data, total, page, totalPages } = result;

  // Summary stats
  const totalSheets = data.reduce((s, r) => s + r.currentSheets, 0);
  const totalSQMT = data.reduce((s, r) => s + r.sqmt, 0);
  const totalValuation = data.reduce((s, r) => s + r.valuation, 0);

  return (
    <Shell>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Stock</h1>
            <p className="text-[var(--muted-foreground)] text-sm">
              {total} products — {formatNumber(totalSheets, 0)} sheets —{" "}
              {formatCurrency(totalValuation)}
            </p>
          </div>
        </div>

        <StockFilters companies={companies} />

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {data.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted-foreground)]">
              No products found.
            </div>
          ) : (
            data.map((row) => (
              <Link
                key={row.productId}
                href={`/stock/${row.productId}`}
                className="block bg-[var(--card)] rounded-xl border border-[var(--border)] p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{row.productName}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {row.companyCode} • {row.height}×{row.width}cm • {row.thickness}mm
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-[var(--muted-foreground)] shrink-0 ml-2" />
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">Stock</p>
                    <p className="font-semibold text-sm">{formatNumber(row.currentSheets, 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">SQMT</p>
                    <p className="font-semibold text-sm">{formatNumber(row.sqmt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">Value</p>
                    <p className="font-semibold text-sm">{formatCurrency(row.valuation)}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    row.currentSheets > 10
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                      : row.currentSheets > 0
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  }`}>
                    {row.currentSheets > 10 ? "In Stock" : row.currentSheets > 0 ? "Low Stock" : "Out of Stock"}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-left px-4 py-3 font-medium">Company</th>
                  <th className="text-right px-4 py-3 font-medium">Dimensions</th>
                  <th className="text-right px-4 py-3 font-medium">Opening</th>
                  <th className="text-right px-4 py-3 font-medium">Purchases</th>
                  <th className="text-right px-4 py-3 font-medium">Sales</th>
                  <th className="text-right px-4 py-3 font-medium">Current</th>
                  <th className="text-right px-4 py-3 font-medium">SQMT</th>
                  <th className="text-right px-4 py-3 font-medium">Valuation</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-[var(--muted-foreground)]">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr
                      key={row.productId}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)]"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.productName}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{row.thickness}mm</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{row.companyCode}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {row.height}×{row.width}cm
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatNumber(row.openingSheets, 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600">
                        {row.purchaseSheets > 0 ? `+${formatNumber(row.purchaseSheets, 0)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-red-600">
                        {row.saleSheets > 0 ? `-${formatNumber(row.saleSheets, 0)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {formatNumber(row.currentSheets, 0)}
                        <span className={`ml-1 inline-block w-2 h-2 rounded-full ${
                          row.currentSheets > 10
                            ? "bg-emerald-500"
                            : row.currentSheets > 0
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{formatNumber(row.sqmt)}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        {formatCurrency(row.valuation)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/stock/${row.productId}`}
                          className="text-[var(--primary)] hover:underline text-xs"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/stock?page=${p}${params.q ? `&q=${params.q}` : ""}${params.company ? `&company=${params.company}` : ""}${params.status ? `&status=${params.status}` : ""}`}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  p === page
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)]"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}