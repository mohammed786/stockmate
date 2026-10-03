"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useCallback, useTransition } from "react";

interface Props {
  companies: { id: string; code: string; name: string }[];
}

export function StockFilters({ companies }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // Reset page on filter change
      startTransition(() => {
        router.push(`/stock?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
        <input
          type="text"
          placeholder="Search products..."
          defaultValue={searchParams.get("q") || ""}
          onChange={(e) => setParam("q", e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        {searchParams.get("q") && (
          <button
            onClick={() => setParam("q", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-[var(--muted-foreground)]" />
          </button>
        )}
      </div>

      {/* Company filter */}
      <select
        value={searchParams.get("company") || ""}
        onChange={(e) => setParam("company", e.target.value)}
        className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      >
        <option value="">All Companies</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} — {c.name}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={searchParams.get("status") || ""}
        onChange={(e) => setParam("status", e.target.value)}
        className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      >
        <option value="">All Stock</option>
        <option value="in-stock">In Stock</option>
        <option value="low-stock">Low Stock</option>
        <option value="out-of-stock">Out of Stock</option>
      </select>
    </div>
  );
}