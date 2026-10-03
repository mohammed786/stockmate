# StockMate Domain Decisions

## 1. Company Structure

**Decision:** Three companies exist in the workbook: SGG (Saint-Gobain Glass), GG (Gujarat Glass/Guardian), ASAHI (Asahi India Glass).

**Source:** CALC sheets, column CO. (index 1).

**Reason:** These are glass manufacturers/suppliers whose products are stocked.

**Impact:** Company is a first-class entity linked to products.

---

## 2. Product Identity

**Decision:** Products are identified by the combination of Company Code + Product Name. There is no explicit SKU/code field in the workbook.

**Source:** CALC sheets — SR is a sequential row number, not a stable product code.

**Reason:** The workbook uses row ordering as implicit identity. We need a stable identifier.

**Impact:** Generate a deterministic product code from company + name hash, or use database UUIDs. Product names like "3.5MM CLEAR 108" encode thickness, type, and height dimension.

---

## 3. Product Dimensions

**Decision:** Products have HEIGHT (cm) and WIDTH (cm) dimensions. These are physical sheet dimensions.

**Source:** CALC sheets columns 4 (HEIGHT) and 5 (WIDTH).

**Reason:** Used for SQMT calculation. Common dimensions: 108×244, 114×244, 122×244, 138×244, 183×244, 225×321, 200×321, 244×366, 214×305, etc.

**Impact:** Dimensions are product-level attributes (not transaction-level). A product's dimensions don't change between transactions.

---

## 4. SQMT Calculation

**Decision:** SQMT = (Height × Width × Quantity) / 10,000 where dimensions are in centimeters.

**Source:** CALC sheets — verified with multiple products:
- 3.5MM CLEAR 108: 108 × 244 × 58 / 10000 = 152.8416 ✓
- 5MM CLEAR 122*244: 122 × 244 × 117 / 10000 = 348.2856 ✓

**Reason:** The divisor 10,000 = 100 × 100 converts cm² to m².

**Impact:** Core calculation function. Must use Decimal arithmetic, not floating point.

---

## 5. Quantity Units: SHEET vs CASE

**Decision:** Two independent quantity dimensions exist:
- **SHEET** (also called QTY PCS): The number of glass sheets. This is the primary unit.
- **CASE**: A secondary packaging unit. Most products have CASE=1 per SHEET, some have CASE=2.

**Source:** Monthly sheets track both SHEET and CASE for opening, purchases, and sales. CALC sheets show SHEET and QTY PCS (which are identical).

**Reason:** Glass sheets may be packed in cases containing 1 or 2 sheets. CASE tracks the packaging count separately.

**Impact:** Stock is tracked in both SHEET and CASE. SQMT is calculated from SHEET quantity only. CASE is always derived (CASE = SHEET for CASE=1 products, CASE = SHEET/2 for CASE=2 products).

**Ambiguity:** The workbook doesn't explicitly define the SHEET-to-CASE ratio per product. We infer it from the opening stock data (CASE value when SHEET is known). Products with CASE=2 when SHEET=1 suggest double-packed cases.

---

## 6. Rates

**Decision:** Two rate types exist:
- **MTR RATE**: Rate per running meter (MTR)
- **SQMT RATE**: Rate per square meter (SQMT) = MTR RATE × Thickness(mm) / 1000

**Source:** CALC sheets columns 10 (MTR RATE) and 11 (SQMT RATE).

**Verification:** 3.5MM CLEAR: MTR=95, SQMT=332.5 = 95 × 3.5 = 332.5 ✓

**Impact:** Rates vary by month (e.g., MTR RATE changes from 95 to 105 between June and July for SGG products). Rates are stored per product per month (in the CALC sheet context).

---

## 7. Stock Valuation

**Decision:** Stock Valuation = SQMT × SQMT RATE

**Source:** CALC sheets column 12 (AMOUNT) = column 8 (SQMT) × column 11 (SQMT RATE).

**Impact:** Valuation is calculated, not stored. Changes when rates change.

---

## 8. Monthly Structure

**Decision:** Each month has:
1. A **Daily Transaction Sheet** (e.g., APRIL-26) with columns for each day of the month
2. A **Stock Calculation Sheet** (e.g., CALC APRIL-26) showing closing stock with SQMT and valuation

**Source:** Both sheet types exist for each of the 6 months (April–September 2026).

**Reason:** The daily sheet records raw transactions; the CALC sheet provides the month-end summary.

**Impact:** The CALC sheet's SHEET column represents the **closing stock** for that month, which becomes the **opening stock** for the next month.

---

## 9. Transaction Column Layout

**Decision:** Each day in the monthly sheet occupies 5 columns:
- Col+0: Purchase SHEET
- Col+1: Purchase CASE
- Col+2: Sale SHEET
- Col+3: Sale CASE
- Col+4: Spacer (empty)

Dates start at column 9 and increment by 5 (9, 14, 19, 24, ...).

**Source:** Row 1 headers (PURCHASE/SALE) and row 2 sub-headers (SHEET/CASE).

**Impact:** Import script must parse this specific column layout.

---

## 10. Opening Stock

**Decision:** Opening stock for each month equals the closing stock from the previous month's CALC sheet.

**Source:** Verified: CALC APRIL-26 SHEET=58 → MAY-26 OPENING=58 for "3.5MM CLEAR 108".

**Impact:** Only the first month's opening stock needs to be seeded; subsequent months derive from prior closings.

---

## 11. Closing Stock Formula

**Decision:** Closing SHEET = Opening SHEET + Total Purchases SHEET − Total Sales SHEET (for the month)

**Source:** Verified with "3.5MM CLEAR 108" in JULY-26:
- Opening: 58
- Sales: 2 (Jul 3) + 1 (Jul 25) = 3
- Closing: 58 − 3 = 55 ✓

**Impact:** Core stock calculation. Must be computed from transaction ledger, not stored as mutable state.

---

## 12. Party/Customer Information

**Decision:** The workbook does NOT record party names (supplier for purchases, customer for sales). Only quantities are recorded per day.

**Source:** Monthly sheet columns only contain SHEET and CASE values — no party name columns.

**Impact:** Party information will be captured in the web app but is not available from historical Excel data. Historical transactions will have NULL party.

---

## 13. Invoice/Reference Numbers

**Decision:** No invoice or reference numbers exist in the workbook.

**Source:** Column inspection of monthly sheets.

**Impact:** The web app will support optional invoice numbers for new transactions. Historical data has none.

---

## 14. Financial Year

**Decision:** The workbook covers FY 2026-27 (April 2026 to March 2027). Currently contains April through September 2026.

**Source:** Sheet names (APRIL-26 through Sep-26) and CALC sheet dates.

**Impact:** Application should support fiscal year awareness.

---

## 15. Product Rate Changes

**Decision:** Rates (MTR RATE, SQMT RATE) can change between months. They appear to be set at the product level for a given period.

**Source:** CALC sheets show different rates:
- SGG MTR RATE: 95 (Apr–Jun), 105 (Jul–Sep)
- SQMT RATE follows proportionally

**Impact:** Rates should be stored with effective dates or per-period. Current rate on a product record, historical rates in a separate table or derived from CALC sheets.

---

## 16. Total/Summary Rows

**Decision:** Both sheet types contain TOTAL rows at the bottom. These must be excluded during import.

**Source:** Monthly sheets have TOTAL rows with product=NULL. CALC sheets have TOTAL + CLOSING STOCK rows.

**Impact:** Import must detect and skip total/summary rows by checking for null product names or "TOTAL"/"CLOSING STOCK" markers.

---

## 17. Null/Empty Cases

**Decision:** Some products show CASE=0 for opening stock but CASE=1 or CASE=2 for closing stock (or vice versa). CASE quantity appears to be derived from SHEET quantity, not independently tracked.

**Source:** Multiple products in monthly sheets show inconsistent CASE values.

**Impact:** For import, trust SHEET as primary. CASE is informational/derived. In the web app, both are independently tracked for flexibility.

---

## 18. Data Quality Observations

- "PURCHASE" is consistently misspelled as "PURHCASE" in the workbook headers
- Date format varies: "11/04/26" vs "11-04-26"
- Some products appear with 0 stock across all months (likely discontinued)
- The workbook has 161 unique products (137 SGG + 17 GG + 7 ASAHI)
- Daily transactions are sparse — most days have no entries for most products