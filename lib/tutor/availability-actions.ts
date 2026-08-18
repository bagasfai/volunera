// lib/tutor/availability-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { getUserId } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { firstFieldErrors } from '@/lib/validation/auth'
import {
  availabilityExceptionSchema,
  availabilityWindowSchema,
} from '@/lib/validation/availability'

export type AvailabilityActionState = {
  error?: string
  fieldErrors?: Record<string, string>
}

export async function addAvailabilityWindow(
  _prev: AvailabilityActionState,
  formData: FormData,
): Promise<AvailabilityActionState> {
  const parsed = availabilityWindowSchema.safeParse({
    weekday: formData.get('weekday'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
  })

  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error) }
  }

  const userId = await getUserId()
  if (!userId) {
    return { error: 'You must be signed in to edit availability.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('tutor_availability').insert({
    tutor_id: userId,
    weekday: parsed.data.weekday,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
  })

  if (error) {
    if (error.code === '23P01') {
      return { error: 'That window overlaps one you already have on this day.' }
    }
    return { error: 'Could not save that window. Try again.' }
  }

  revalidatePath('/dashboard')
  return {}
}

export async function removeAvailabilityWindow(
  windowId: string,
): Promise<AvailabilityActionState> {
  const userId = await getUserId()
  if (!userId) {
    return { error: 'You must be signed in to edit availability.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tutor_availability')
    .delete()
    .eq('id', windowId)
    .eq('tutor_id', userId)

  if (error) {
    return { error: 'Could not remove that window. Try again.' }
  }

  revalidatePath('/dashboard')
  return {}
}

export async function addAvailabilityException(
  _prev: AvailabilityActionState,
  formData: FormData,
): Promise<AvailabilityActionState> {
  const parsed = availabilityExceptionSchema.safeParse({
    exceptionDate: formData.get('exceptionDate'),
    reason: formData.get('reason') ?? '',
  })

  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error) }
  }

  const userId = await getUserId()
  if (!userId) {
    return { error: 'You must be signed in to edit availability.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('tutor_availability_exceptions').insert({
    tutor_id: userId,
    exception_date: parsed.data.exceptionDate,
    reason: parsed.data.reason || null,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'That date is already blocked.' }
    }
    return { error: 'Could not block that date. Try again.' }
  }

  revalidatePath('/dashboard')
  return {}
}

export async function removeAvailabilityException(
  exceptionId: string,
): Promise<AvailabilityActionState> {
  const userId = await getUserId()
  if (!userId) {
    return { error: 'You must be signed in to edit availability.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tutor_availability_exceptions')
    .delete()
    .eq('id', exceptionId)
    .eq('tutor_id', userId)

  if (error) {
    return { error: 'Could not remove that date. Try again.' }
  }

  revalidatePath('/dashboard')
  return {}
}
