// lib/admin/review-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

export type ReviewState = { error?: string }

async function setApplicationStatus(
  tutorId: string,
  status: 'approved' | 'rejected',
): Promise<ReviewState> {
  const admin = await requireRole('admin')
  const supabase = await createClient()
  const { error } = await supabase
    .from('tutor_profiles')
    .update({
      application_status: status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
    })
    .eq('profile_id', tutorId)

  if (error) {
    return { error: 'Could not update this application. Try again.' }
  }

  revalidatePath('/dashboard/tutors')
  return {}
}

export async function approveApplication(tutorId: string): Promise<ReviewState> {
  return setApplicationStatus(tutorId, 'approved')
}

export async function rejectApplication(tutorId: string): Promise<ReviewState> {
  return setApplicationStatus(tutorId, 'rejected')
}
