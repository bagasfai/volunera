import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { getApplicationDetail } from '@/lib/admin/dal'
import { approveApplication, rejectApplication } from '@/lib/admin/review-actions'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function AdminTutorDetailPage({
  params,
}: {
  params: Promise<{ tutorId: string }>
}) {
  await requireRole('admin')
  const { tutorId } = await params
  const { profile, gradeLevelLabels, subjectLabels } =
    await getApplicationDetail(tutorId)

  if (!profile) notFound()

  let photoSignedUrl: string | null = null
  if (profile.photo_url) {
    const supabase = await createClient()
    const { data } = await supabase.storage
      .from('tutor-photos')
      .createSignedUrl(profile.photo_url, 60)
    photoSignedUrl = data?.signedUrl ?? null
  }

  async function approve() {
    'use server'
    const result = await approveApplication(tutorId)
    if (result.error) {
      throw new Error(result.error)
    }
  }

  async function reject() {
    'use server'
    const result = await rejectApplication(tutorId)
    if (result.error) {
      throw new Error(result.error)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-lg font-medium">
        {profile.profiles?.first_name} {profile.profiles?.last_name}
      </h1>
      {photoSignedUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- signed URL is one-time-use, next/image can't optimize it
        <img
          src={photoSignedUrl}
          alt="Tutor photo"
          className="h-32 w-32 rounded object-cover"
        />
      )}
      <p>Status: {profile.application_status}</p>
      <p>Phone: {profile.phone}</p>
      <p>Date of birth: {profile.date_of_birth}</p>
      <p>School / college status: {profile.education_status}</p>
      <p>Languages: {(profile.languages ?? []).join(', ')}</p>
      <p>Grade levels: {gradeLevelLabels.join(', ')}</p>
      <p>Subjects: {subjectLabels.join(', ')}</p>
      <p>Teaching style: {(profile.teaching_style_tags ?? []).join(', ')}</p>
      <p>Bio: {profile.bio}</p>
      <p>Motivation: {profile.motivation}</p>
      {profile.prior_experience && <p>Prior experience: {profile.prior_experience}</p>}

      <div className="flex gap-2">
        <form action={approve}>
          <Button type="submit">Approve</Button>
        </form>
        <form action={reject}>
          <Button type="submit" variant="outline">
            Reject
          </Button>
        </form>
      </div>
    </section>
  )
}
