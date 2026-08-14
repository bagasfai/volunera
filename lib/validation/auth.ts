import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

export const signUpSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .max(72, 'Use at most 72 characters.'),
})

export const onboardingSchema = z.object({
  role: z.enum(['student', 'tutor'], {
    message: 'Choose whether you are here to learn or to tutor.',
  }),
  firstName: z.string().trim().min(1, 'Enter your first name.').max(80),
  lastName: z.string().trim().min(1, 'Enter your last name.').max(80),
  timezone: z.string().trim().min(1, 'Your timezone could not be detected.'),
})

/** Collapses zod's string[] per field down to the first message. */
export function firstFieldErrors(
  error: z.ZodError,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_')
    if (!(key in out)) out[key] = issue.message
  }
  return out
}
