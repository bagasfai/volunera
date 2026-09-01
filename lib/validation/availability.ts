import { z } from "zod";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const availabilityWindowSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(TIME_PATTERN, "Enter a time as HH:MM."),
    endTime: z.string().regex(TIME_PATTERN, "Enter a time as HH:MM."),
  })
  .refine((value) => value.endTime > value.startTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

export type AvailabilityWindowInput = z.infer<typeof availabilityWindowSchema>;

export const availabilityExceptionSchema = z.object({
  exceptionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date as YYYY-MM-DD.")
    .refine((value) => {
      const floor = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      return value >= floor;
    }, "Choose today or a future date."),
  reason: z.string().trim().max(200).optional().default(""),
});

export type AvailabilityExceptionInput = z.infer<
  typeof availabilityExceptionSchema
>;
