import { describe, expect, it } from "vitest";
import { tutorApplicationSchema } from "./tutor-application";

const validInput = {
  phone: "+1-555-0100",
  dateOfBirth: "2000-01-01",
  educationStatus: "College sophomore",
  bio: "I love helping students learn.",
  motivation: "I want to give back.",
  priorExperience: "",
  languages: "English, Spanish, English",
  teachingStyleTags: ["Visual explanations"],
  gradeLevelIds: ["11111111-1111-4111-8111-111111111111"],
  subjectIds: ["22222222-2222-4222-8222-222222222222"],
  photoUrl: "",
};

describe("tutorApplicationSchema", () => {
  it("accepts a fully filled valid application", () => {
    expect(tutorApplicationSchema.safeParse(validInput).success).toBe(true);
  });

  it("dedupes and trims the comma-separated languages field", () => {
    const result = tutorApplicationSchema.parse(validInput);
    expect(result.languages).toEqual(["English", "Spanish"]);
  });

  it("rejects a future date of birth", () => {
    const result = tutorApplicationSchema.safeParse({
      ...validInput,
      dateOfBirth: "2999-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty grade level selection", () => {
    const result = tutorApplicationSchema.safeParse({
      ...validInput,
      gradeLevelIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty subject selection", () => {
    const result = tutorApplicationSchema.safeParse({
      ...validInput,
      subjectIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty bio", () => {
    const result = tutorApplicationSchema.safeParse({
      ...validInput,
      bio: "  ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty languages field", () => {
    const result = tutorApplicationSchema.safeParse({
      ...validInput,
      languages: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("defaults prior experience to an empty string when omitted", () => {
    const { priorExperience, ...rest } = validInput;
    void priorExperience;
    const result = tutorApplicationSchema.parse(rest);
    expect(result.priorExperience).toBe("");
  });
});
