import { describe, it, expect } from "vitest";
import {
  calculateSQMT,
  calculateSQMTRate,
  calculateValuation,
} from "@/lib/stock";

describe("Stock Calculations", () => {
  describe("calculateSQMT", () => {
    it("calculates SQMT correctly for 3.5MM CLEAR 108", () => {
      // From CALC APRIL-26: height=108, width=244, qty=58 → SQMT=152.8416
      const result = calculateSQMT(108, 244, 58);
      expect(result).toBeCloseTo(152.8416, 4);
    });

    it("calculates SQMT correctly for 5MM CLEAR 122*244", () => {
      // From CALC APRIL-26: height=122, width=244, qty=117 → SQMT=348.2856
      const result = calculateSQMT(122, 244, 117);
      expect(result).toBeCloseTo(348.2856, 4);
    });

    it("calculates SQMT correctly for 4MM CLEAR 108", () => {
      // height=108, width=244, qty=100 → SQMT=263.52
      const result = calculateSQMT(108, 244, 100);
      expect(result).toBeCloseTo(263.52, 4);
    });

    it("returns 0 for zero quantity", () => {
      expect(calculateSQMT(108, 244, 0)).toBe(0);
    });

    it("handles large dimensions", () => {
      // 3660×2440 format → height=244, width=366
      const result = calculateSQMT(244, 366, 50);
      expect(result).toBeCloseTo(447.36, 4);
    });
  });

  describe("calculateSQMTRate", () => {
    it("calculates SQMT rate from MTR rate and thickness", () => {
      // MTR=95, thickness=3.5mm → SQMT_RATE=332.5
      expect(calculateSQMTRate(95, 3.5)).toBeCloseTo(332.5, 2);
    });

    it("calculates for 4mm thickness", () => {
      // MTR=95, thickness=4mm → SQMT_RATE=380
      expect(calculateSQMTRate(95, 4)).toBeCloseTo(380, 2);
    });

    it("calculates for 5mm thickness", () => {
      // MTR=105, thickness=5mm → SQMT_RATE=525
      expect(calculateSQMTRate(105, 5)).toBeCloseTo(525, 2);
    });
  });

  describe("calculateValuation", () => {
    it("calculates amount from SQMT and rate", () => {
      // SQMT=152.8416, rate=332.5 → amount=50819.832
      const result = calculateValuation(152.8416, 332.5);
      expect(result).toBeCloseTo(50819.832, 2);
    });

    it("returns 0 for zero SQMT", () => {
      expect(calculateValuation(0, 332.5)).toBe(0);
    });

    it("returns 0 for zero rate", () => {
      expect(calculateValuation(152.8416, 0)).toBe(0);
    });
  });
});