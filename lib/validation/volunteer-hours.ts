import { z } from "zod";

export const adjustmentSchema = z.object({
  tutorId: z.guid(),
  minutes: z.coerce
    .number()
    .int("Enter a whole number of minutes.")
    .refine((value) => value !== 0, "An adjustment cannot be zero minutes.")
    .refine(
      (value) => Math.abs(value) <= 100000,
      "That adjustment is implausibly large.",
    ),
  reason: z
    .string()
    .trim()
    .min(1, "Say why this adjustment is being made.")
    .max(500, "Keep the reason under 500 characters."),
});

export type AdjustmentInput = z.infer<typeof adjustmentSchema>;
