"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSale } from "@/actions/sales";
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  code: string;
  name: string;
  company: { code: string };
}

interface Company {
  id: string;
  code: string;
  name: string;
}

interface Props {
  products: Product[];
  companies: Company[];
}

interface LineItem {
  key: string;
  productId: string;
  sheets: string;
  cases: string;
}

export function SaleForm({ products, companies }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [companyId, setCompanyId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { key: "1", productId: "", sheets: "0", cases: "0" },
  ]);

  const addItem = () => {
    setItems([...items, { key: String(Date.now()), productId: "", sheets: "0", cases: "0" }]);
  };

  const removeItem = (key: string) => {
    if (items.length > 1) setItems(items.filter((i) => i.key !== key));
  };

  const updateItem = (key: string, field: keyof LineItem, value: string) => {
    setItems(items.map((i) => (i.key === key ? { ...i, [field]: value } : i)));
  };

  const handleSubmit = () => {
    setError(null);

    const validItems = items.filter(
      (i) => i.productId && (Number(i.sheets) > 0 || Number(i.cases) > 0)
    );

    if (validItems.length === 0) {
      setError("Add at least one item with quantity.");
      return;
    }

    startTransition(async () => {
      try {
        await createSale({
          date,
          companyId: companyId || undefined,
          customerName: customerName || undefined,
          invoiceNo: invoiceNo || undefined,
          notes: notes || undefined,
          items: validItems.map((i) => ({
            productId: i.productId,
            sheets: Number(i.sheets),
            cases: Number(i.cases),
          })),
        });
        router.push("/sales");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create sale.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/sales"
          className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold">New Sale</h1>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg p-4 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Header */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in customer"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Company</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="">Select company...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Invoice No.</label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Items</h3>
          <button
            onClick={addItem}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--accent)] rounded-lg"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.key}
              className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_40px] gap-3 items-end"
            >
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Product</label>
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(item.key, "productId", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.company.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Sheets</label>
                <input
                  type="number"
                  min="0"
                  value={item.sheets}
                  onChange={(e) => updateItem(item.key, "sheets", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Cases</label>
                <input
                  type="number"
                  min="0"
                  value={item.cases}
                  onChange={(e) => updateItem(item.key, "cases", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <button
                onClick={() => removeItem(item.key)}
                className="p-2.5 rounded-lg border border-[var(--border)] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                disabled={items.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Sale
        </button>
        <Link
          href="/sales"
          className="px-6 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--accent)]"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}