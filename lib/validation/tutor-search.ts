import { z } from "zod";

export const tutorSearchParamsSchema = z.object({
  grade: z.string().uuid().optional(),
  subject: z.string().uuid().optional(),
  language: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type TutorSearchParams = z.infer<typeof tutorSearchParamsSchema>;
