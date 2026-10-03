import { Shell } from "@/components/layout/shell";
import { getSaleById } from "@/actions/sales";
import { formatNumber, formatDate, toNum } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let sale;
  try {
    sale = await getSaleById(id);
  } catch {
    notFound();
  }
  if (!sale) notFound();

  const totalSheets = sale.items.reduce((s, i) => s + toNum(i.sheets), 0);
  const totalCases = sale.items.reduce((s, i) => s + toNum(i.cases), 0);

  return (
    <Shell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Link href="/sales" className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Sale Details</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {formatDate(sale.date)} — {sale.customerName || sale.company?.code || "No Customer"}
            </p>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[var(--muted-foreground)]">Date</p>
              <p className="font-medium">{formatDate(sale.date)}</p>
            </div>
            <div>
              <p className="text-[var(--muted-foreground)]">Customer</p>
              <p className="font-medium">{sale.customerName || "—"}</p>
            </div>
            <div>
              <p className="text-[var(--muted-foreground)]">Company</p>
              <p className="font-medium">{sale.company?.name || "—"}</p>
            </div>
            <div>
              <p className="text-[var(--muted-foreground)]">Invoice</p>
              <p className="font-medium">{sale.invoiceNo || "—"}</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-right px-4 py-3 font-medium">Sheets</th>
                <th className="text-right px-4 py-3 font-medium">Cases</th>
                <th className="text-right px-4 py-3 font-medium">SQMT</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => {
                const sqmt = toNum(item.product.height) * toNum(item.product.width) * toNum(item.sheets) / 10000;
                return (
                  <tr key={item.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{item.product.name}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{item.product.company.code}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatNumber(item.sheets, 0)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatNumber(item.cases, 0)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatNumber(sqmt)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--border)] font-semibold">
                <td colSpan={3} className="px-4 py-3 text-right">Total</td>
                <td className="px-4 py-3 text-right font-mono">{formatNumber(totalSheets, 0)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatNumber(totalCases, 0)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Shell>
  );
}