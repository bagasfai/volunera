import { describe, expect, it } from "vitest";
import { gradeLevelSchema, subjectSchema } from "./lookup";

describe("gradeLevelSchema", () => {
  it("accepts a valid grade level", () => {
    const result = gradeLevelSchema.safeParse({
      label: "Grade 7",
      category: "middle",
      sortOrder: "70",
    });
    expect(result.success).toBe(true);
    expect(result.data?.sortOrder).toBe(70);
  });

  it("rejects an unknown category", () => {
    const result = gradeLevelSchema.safeParse({
      label: "Grade 7",
      category: "university",
      sortOrder: "70",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a blank label", () => {
    const result = gradeLevelSchema.safeParse({
      label: "   ",
      category: "middle",
      sortOrder: "70",
    });
    expect(result.success).toBe(false);
  });
});

describe("subjectSchema", () => {
  it("accepts a subject with an optional category", () => {
    const result = subjectSchema.safeParse({
      label: "Geometry",
      category: "",
      sortOrder: "20",
    });
    expect(result.success).toBe(true);
    expect(result.data?.category).toBeNull();
  });

  it("rejects a blank label", () => {
    const result = subjectSchema.safeParse({
      label: "",
      category: "STEM",
      sortOrder: "20",
    });
    expect(result.success).toBe(false);
  });
});
