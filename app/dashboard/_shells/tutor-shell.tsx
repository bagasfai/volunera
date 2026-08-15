// app/dashboard/_shells/tutor-shell.tsx
import type { Profile } from '@/lib/auth/dal'
import { getApplicationLookups, getMyApplication } from '@/lib/tutor/dal'
import { TutorApplicationForm } from './tutor-application-form'

export async function TutorShell({ profile }: { profile: Profile }) {
  const application = await getMyApplication()
  const lookups = await getApplicationLookups()

  if (!application) {
    // Should not happen for a role='tutor' profile — complete_onboarding()
    // always creates the matching tutor_profiles row — but fail safe rather
    // than crash the dashboard if it somehow does.
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Tutor dashboard</h2>
        <p>No tutor application found for this account.</p>
      </section>
    )
  }

  const { profile: tutorProfile } = application
  const notYetSubmitted = tutorProfile.application_submitted_at === null

  if (tutorProfile.application_status === 'approved') {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Tutor dashboard</h2>
        <p>
          Hello, {profile.first_name}. Your application is approved.
          Availability and sessions arrive in a later phase.
        </p>
      </section>
    )
  }

  if (
    tutorProfile.application_status === 'inactive' ||
    tutorProfile.application_status === 'suspended'
  ) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Tutor dashboard</h2>
        <p>
          Your account status is &ldquo;{tutorProfile.application_status}
          &rdquo;. Contact an admin for details.
        </p>
      </section>
    )
  }

  if (tutorProfile.application_status === 'pending' && !notYetSubmitted) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Tutor dashboard</h2>
        <p>Your application is under review. We&rsquo;ll email you once an admin has looked at it.</p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">
        {tutorProfile.application_status === 'rejected'
          ? 'Your application was not approved'
          : 'Become a volunteer tutor'}
      </h2>
      {tutorProfile.application_status === 'rejected' && (
        <p className="text-sm text-muted-foreground">
          You can update your application below and submit it again.
        </p>
      )}
      <TutorApplicationForm application={application} lookups={lookups} />
    </section>
  )
}
