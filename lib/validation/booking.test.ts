import { describe, expect, it } from "vitest";
import { bookingRequestSchema } from "./booking";

const validInput = {
  tutorId: "44444444-4444-4444-4444-444444444444",
  startTime: "2026-09-01T16:00:00.000Z",
  subjectId: "11111111-1111-1111-1111-111111111111",
  gradeLevelId: "22222222-2222-2222-2222-222222222222",
  topicCategory: "homework",
  topic: "Fractions",
};

describe("bookingRequestSchema", () => {
  it("accepts a valid booking request", () => {
    const result = bookingRequestSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects a non-uuid tutorId", () => {
    const result = bookingRequestSchema.safeParse({
      ...validInput,
      tutorId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed startTime", () => {
    const result = bookingRequestSchema.safeParse({
      ...validInput,
      startTime: "tomorrow",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a topicCategory outside the fixed six", () => {
    const result = bookingRequestSchema.safeParse({
      ...validInput,
      topicCategory: "other_stuff",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty topic", () => {
    const result = bookingRequestSchema.safeParse({
      ...validInput,
      topic: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a topic longer than 200 characters", () => {
    const result = bookingRequestSchema.safeParse({
      ...validInput,
      topic: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("trims topic whitespace", () => {
    const result = bookingRequestSchema.safeParse({
      ...validInput,
      topic: "  Fractions  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.topic).toBe("Fractions");
    }
  });
});
