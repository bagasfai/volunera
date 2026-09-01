import { describe, expect, it } from "vitest";
import {
  availabilityExceptionSchema,
  availabilityWindowSchema,
} from "./availability";

describe("availabilityWindowSchema", () => {
  it("accepts a valid window", () => {
    const result = availabilityWindowSchema.safeParse({
      weekday: "1",
      startTime: "09:00",
      endTime: "11:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a weekday outside 0-6", () => {
    const result = availabilityWindowSchema.safeParse({
      weekday: "7",
      startTime: "09:00",
      endTime: "11:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed time string", () => {
    const result = availabilityWindowSchema.safeParse({
      weekday: "1",
      startTime: "9am",
      endTime: "11:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects end time not after start time", () => {
    const result = availabilityWindowSchema.safeParse({
      weekday: "1",
      startTime: "11:00",
      endTime: "09:00",
    });
    expect(result.success).toBe(false);
  });
});

describe("availabilityExceptionSchema", () => {
  it("accepts a future date with no reason", () => {
    const result = availabilityExceptionSchema.safeParse({
      exceptionDate: "2099-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a future date with a reason", () => {
    const result = availabilityExceptionSchema.safeParse({
      exceptionDate: "2099-01-01",
      reason: "Vacation",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed date string", () => {
    const result = availabilityExceptionSchema.safeParse({
      exceptionDate: "01/01/2099",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a date in the past", () => {
    const result = availabilityExceptionSchema.safeParse({
      exceptionDate: "2000-01-01",
    });
    expect(result.success).toBe(false);
  });
});
