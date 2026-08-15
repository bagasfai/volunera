import { z } from 'zod'

const requiredText = (max: number, message: string) =>
  z.string().trim().min(1, message).max(max)

export const tutorApplicationSchema = z.object({
  phone: requiredText(30, 'Enter a phone number.'),
  dateOfBirth: z
    .string()
    .trim()
    .min(1, 'Enter your date of birth.')
    .refine((value) => {
      const parsed = new Date(value)
      return !Number.isNaN(parsed.getTime()) && parsed.getTime() < Date.now()
    }, 'Enter a valid date in the past.'),
  educationStatus: requiredText(120, 'Enter your school or college status.'),
  bio: requiredText(1200, 'Tell students a little about yourself.'),
  motivation: requiredText(1200, 'Tell us why you want to volunteer.'),
  priorExperience: z.string().trim().max(1200).optional().default(''),
  languages: z
    .string()
    .trim()
    .min(1, 'List at least one language.')
    .transform((value) =>
      Array.from(
        new Set(
          value
            .split(',')
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0),
        ),
      ),
    )
    .refine((languages) => languages.length > 0, 'List at least one language.'),
  teachingStyleTags: z.array(z.string()).optional().default([]),
  gradeLevelIds: z
    .array(z.string().uuid())
    .min(1, 'Select at least one grade level.'),
  subjectIds: z.array(z.string().uuid()).min(1, 'Select at least one subject.'),
  photoUrl: z.string().trim().optional().default(''),
})

export type TutorApplicationInput = z.infer<typeof tutorApplicationSchema>
