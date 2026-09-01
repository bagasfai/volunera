import { z } from "zod";

export const TOPIC_CATEGORIES = [
  "homework",
  "classwork",
  "general_improvement",
  "upcoming_test",
  "organization_curriculum",
  "other",
] as const;

export const bookingRequestSchema = z.object({
  tutorId: z.guid(),
  startTime: z.iso.datetime(),
  subjectId: z.guid(),
  gradeLevelId: z.guid(),
  topicCategory: z.enum(TOPIC_CATEGORIES),
  topic: z.string().trim().min(1).max(200),
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
