import { describe, expect, it } from "vitest";
import {
  formatMinutesAsHours,
  formatSessionDate,
  formatSessionRange,
  formatSessionTime,
} from "./datetime";

// 2026-09-01T16:00:00Z is 9:00 AM in America/Los_Angeles (PDT).
const START = "2026-09-01T16:00:00.000Z";
const END = "2026-09-01T16:45:00.000Z";

describe("formatSessionDate", () => {
  it("renders the date in the given timezone", () => {
    expect(formatSessionDate(START, "America/Los_Angeles")).toBe("Tue, Sep 1");
  });

  it("can land on a different calendar day in a different timezone", () => {
    // 2026-09-02T02:00:00Z is Sep 1 in Los Angeles but Sep 2 in London.
    expect(formatSessionDate("2026-09-02T02:00:00.000Z", "Europe/London")).toBe(
      "Wed, Sep 2",
    );
  });
});

describe("formatSessionTime", () => {
  it("renders the time in the given timezone", () => {
    expect(formatSessionTime(START, "America/Los_Angeles")).toBe("9:00 AM");
  });

  it("renders the same instant differently in another timezone", () => {
    expect(formatSessionTime(START, "America/Chicago")).toBe("11:00 AM");
  });
});

describe("formatSessionRange", () => {
  it("joins date and both times", () => {
    expect(formatSessionRange(START, END, "America/Los_Angeles")).toBe(
      "Tue, Sep 1 · 9:00 AM – 9:45 AM",
    );
  });
});

describe("formatMinutesAsHours", () => {
  it("renders hours and minutes", () => {
    expect(formatMinutesAsHours(135)).toBe("2h 15m");
  });

  it("drops the hour part below an hour", () => {
    expect(formatMinutesAsHours(45)).toBe("45m");
  });

  it("drops the minute part on a whole hour", () => {
    expect(formatMinutesAsHours(120)).toBe("2h");
  });

  it("renders zero explicitly rather than as an empty string", () => {
    expect(formatMinutesAsHours(0)).toBe("0m");
  });

  it("carries a negative sign for a downward adjustment", () => {
    expect(formatMinutesAsHours(-90)).toBe("-1h 30m");
  });

  it("rounds a fractional value rather than leaking float noise", () => {
    expect(formatMinutesAsHours(135.7)).toBe("2h 16m");
  });

  it("renders a whole hour boundary", () => {
    expect(formatMinutesAsHours(60)).toBe("1h");
  });

  it("renders a negative whole hour with its sign", () => {
    expect(formatMinutesAsHours(-120)).toBe("-2h");
  });
});
