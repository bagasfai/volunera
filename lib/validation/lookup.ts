import { z } from "zod";

export const GRADE_CATEGORIES = ["elementary", "middle", "high"] as const;

const label = z
  .string()
  .trim()
  .min(1, "Enter a label.")
  .max(80, "Keep the label under 80 characters.");

const sortOrder = z.coerce
  .number()
  .int("Sort order must be a whole number.")
  .min(0)
  .max(10000);

export const gradeLevelSchema = z.object({
  label,
  category: z.enum(GRADE_CATEGORIES, {
    message: "Pick elementary, middle, or high.",
  }),
  sortOrder,
});

export const subjectSchema = z.object({
  label,
  category: z
    .string()
    .trim()
    .max(80)
    .transform((value) => (value === "" ? null : value)),
  sortOrder,
});

export type GradeLevelInput = z.infer<typeof gradeLevelSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
