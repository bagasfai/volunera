import { describe, expect, it } from "vitest";
import { adjustmentSchema } from "./volunteer-hours";

const VALID = {
  tutorId: "44444444-4444-4444-4444-444444444444",
  minutes: "120",
  reason: "Ran a summer workshop outside the platform",
};

describe("adjustmentSchema", () => {
  it("accepts a positive adjustment", () => {
    const result = adjustmentSchema.safeParse(VALID);
    expect(result.success).toBe(true);
    expect(result.data?.minutes).toBe(120);
  });

  it("accepts a negative adjustment", () => {
    const result = adjustmentSchema.safeParse({ ...VALID, minutes: "-45" });
    expect(result.success).toBe(true);
    expect(result.data?.minutes).toBe(-45);
  });

  it("rejects a zero adjustment", () => {
    const result = adjustmentSchema.safeParse({ ...VALID, minutes: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects a fractional adjustment", () => {
    const result = adjustmentSchema.safeParse({ ...VALID, minutes: "12.5" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty reason, because an unexplained adjustment is not auditable", () => {
    const result = adjustmentSchema.safeParse({ ...VALID, reason: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid tutor id", () => {
    const result = adjustmentSchema.safeParse({ ...VALID, tutorId: "nope" });
    expect(result.success).toBe(false);
  });
});
