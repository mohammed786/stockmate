import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  generateProductCode,
  toNum,
} from "@/lib/utils";

describe("Utility Functions", () => {
  describe("formatCurrency", () => {
    it("formats Indian currency correctly", () => {
      const result = formatCurrency(50819.832);
      expect(result).toContain("50,819.83");
      expect(result).toContain("₹");
    });

    it("handles zero", () => {
      expect(formatCurrency(0)).toContain("0");
    });

    it("handles string input", () => {
      const result = formatCurrency("12345.67");
      expect(result).toContain("12,345.67");
    });
  });

  describe("formatNumber", () => {
    it("formats with Indian commas", () => {
      expect(formatNumber(1234567.89)).toBe("12,34,567.89");
    });

    it("handles zero decimals", () => {
      expect(formatNumber(100, 0)).toBe("100");
    });
  });

  describe("generateProductCode", () => {
    it("generates code from company and name", () => {
      expect(generateProductCode("SGG", "3.5MM CLEAR 108")).toBe("SGG-3.5MM-CLEAR-108");
    });

    it("handles special characters", () => {
      expect(generateProductCode("SGG", "3.5MM CLEAR 2440*1220")).toBe("SGG-3.5MM-CLEAR-2440-1220");
    });
  });

  describe("toNum", () => {
    it("converts number", () => {
      expect(toNum(42)).toBe(42);
    });

    it("converts string", () => {
      expect(toNum("42.5")).toBe(42.5);
    });

    it("handles null", () => {
      expect(toNum(null)).toBe(0);
    });

    it("handles undefined", () => {
      expect(toNum(undefined)).toBe(0);
    });

    it("handles Prisma Decimal-like objects", () => {
      const decimal = { toNumber: () => 42.5 };
      expect(toNum(decimal)).toBe(42.5);
    });
  });
});