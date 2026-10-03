import { z } from "zod";

// ─── Company ────────────────────────────────────────────────

export const companySchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(20)
    .toUpperCase()
    .regex(/^[A-Z0-9-]+$/, "Only uppercase letters, numbers, and hyphens"),
  name: z.string().min(1, "Name is required").max(200),
});

export type CompanyInput = z.infer<typeof companySchema>;

// ─── Product ────────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  companyId: z.string().min(1, "Company is required"),
  height: z.coerce.number().positive("Height must be positive"),
  width: z.coerce.number().positive("Width must be positive"),
  thickness: z.coerce.number().positive("Thickness must be positive"),
  mtrRate: z.coerce.number().min(0, "Rate cannot be negative"),
  sqmtRate: z.coerce.number().min(0, "Rate cannot be negative"),
});

export type ProductInput = z.infer<typeof productSchema>;

// ─── Purchase ───────────────────────────────────────────────

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  sheets: z.coerce.number().min(0, "Cannot be negative"),
  cases: z.coerce.number().min(0, "Cannot be negative"),
  rate: z.coerce.number().optional(),
});

export const purchaseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  companyId: z.string().optional(),
  invoiceNo: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(purchaseItemSchema)
    .min(1, "At least one item is required")
    .refine(
      (items) => items.some((i) => i.sheets > 0 || i.cases > 0),
      "At least one item must have quantity"
    ),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;

// ─── Sale ───────────────────────────────────────────────────

export const saleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  sheets: z.coerce.number().min(0, "Cannot be negative"),
  cases: z.coerce.number().min(0, "Cannot be negative"),
  rate: z.coerce.number().optional(),
});

export const saleSchema = z.object({
  date: z.string().min(1, "Date is required"),
  companyId: z.string().optional(),
  customerName: z.string().optional(),
  invoiceNo: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(saleItemSchema)
    .min(1, "At least one item is required")
    .refine(
      (items) => items.some((i) => i.sheets > 0 || i.cases > 0),
      "At least one item must have quantity"
    ),
});

export type SaleInput = z.infer<typeof saleSchema>;

// ─── Filters ────────────────────────────────────────────────

export const stockFilterSchema = z.object({
  search: z.string().optional(),
  companyId: z.string().optional(),
  stockStatus: z.enum(["all", "in-stock", "low-stock", "out-of-stock"]).optional(),
  sortBy: z.enum(["name", "company", "sheets", "sqmt", "valuation"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().min(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
});

export type StockFilter = z.infer<typeof stockFilterSchema>;

export const reportFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  companyId: z.string().optional(),
  productId: z.string().optional(),
  type: z.enum(["purchase", "sale", "all"]).optional(),
});

export type ReportFilter = z.infer<typeof reportFilterSchema>;