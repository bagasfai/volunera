// lib/admin/dal.ts
import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

export type PendingApplication = Database['public']['Tables']['tutor_profiles']['Row'] & {
  profiles: { first_name: string; last_name: string; email: string } | null
}

/** Applications ready for admin review: submitted at least once, still pending. */
export async function listPendingApplications(): Promise<PendingApplication[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tutor_profiles')
    .select(
      '*, profiles!tutor_profiles_profile_id_fkey(first_name, last_name, email)',
    )
    .eq('application_status', 'pending')
    .not('application_submitted_at', 'is', null)
    .order('application_submitted_at', { ascending: true })

  return (data ?? []) as PendingApplication[]
}

export type ApplicationDetail = {
  profile: PendingApplication | null
  gradeLevelLabels: string[]
  subjectLabels: string[]
}

/** Full detail for one application, including selected grade levels/subjects. */
export async function getApplicationDetail(
  tutorId: string,
): Promise<ApplicationDetail> {
  const supabase = await createClient()
  const [{ data: profile }, { data: gradeLevels }, { data: subjects }] =
    await Promise.all([
      supabase
        .from('tutor_profiles')
        .select(
          '*, profiles!tutor_profiles_profile_id_fkey(first_name, last_name, email)',
        )
        .eq('profile_id', tutorId)
        .maybeSingle(),
      supabase
        .from('tutor_grade_levels')
        .select('grade_levels(label)')
        .eq('tutor_id', tutorId),
      supabase
        .from('tutor_subjects')
        .select('subjects(label)')
        .eq('tutor_id', tutorId),
    ])

  return {
    profile: profile as PendingApplication | null,
    gradeLevelLabels: (gradeLevels ?? [])
      .map((row) => row.grade_levels?.label)
      .filter((label): label is string => Boolean(label)),
    subjectLabels: (subjects ?? [])
      .map((row) => row.subjects?.label)
      .filter((label): label is string => Boolean(label)),
  }
}
