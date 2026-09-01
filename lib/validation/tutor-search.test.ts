import { describe, expect, it } from "vitest";
import { tutorSearchParamsSchema } from "./tutor-search";

describe("tutorSearchParamsSchema", () => {
  it("accepts a full valid combination", () => {
    const result = tutorSearchParamsSchema.safeParse({
      grade: "11111111-1111-4111-8111-111111111111",
      subject: "22222222-2222-4222-8222-222222222222",
      language: "Spanish",
      page: "2",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        grade: "11111111-1111-4111-8111-111111111111",
        subject: "22222222-2222-4222-8222-222222222222",
        language: "Spanish",
        page: 2,
      });
    }
  });

  it("defaults page to 1 when missing", () => {
    const result = tutorSearchParamsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
    }
  });

  it("rejects a malformed page value", () => {
    const result = tutorSearchParamsSchema.safeParse({ page: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid grade value", () => {
    const result = tutorSearchParamsSchema.safeParse({ grade: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("ignores unknown keys instead of rejecting", () => {
    const result = tutorSearchParamsSchema.safeParse({ bogus: "x" });
    expect(result.success).toBe(true);
  });
});
