import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserRole = Database['public']['Enums']['user_role']

/**
 * The authenticated user for this request, or null. Memoised per render pass.
 *
 * getUser() revalidates against the auth server rather than verifying the JWT
 * locally, which is what makes a signed-out or revoked session actually stop
 * working. getClaims() would keep accepting a captured token until it expired.
 * Never getSession() — it verifies nothing at all.
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

/** The authenticated user's id, or null. */
export const getUserId = cache(async (): Promise<string | null> => {
  const user = await getUser()
  return user?.id ?? null
})

/** The caller's profile row, or null when they have not onboarded. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const userId = await getUserId()
  if (!userId) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  // An RLS denial returns no rows rather than an error, so null here means
  // "not visible or not present" — both of which mean "not onboarded".
  return data
})

/** Redirects to /login without a session, /onboarding without a profile. */
export async function requireProfile(): Promise<Profile> {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const profile = await getProfile()
  if (!profile) redirect('/onboarding')

  return profile
}

/** Redirects to /dashboard when the caller's role is not in `roles`. */
export async function requireRole(...roles: UserRole[]): Promise<Profile> {
  const profile = await requireProfile()
  if (!roles.includes(profile.role)) redirect('/dashboard')
  return profile
}
