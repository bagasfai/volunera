import type { Profile } from '@/lib/auth/dal'

export function StudentShell({ profile }: { profile: Profile }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Student dashboard</h2>
      <p>
        Hello, {profile.first_name}. Finding a tutor arrives in a later phase.
      </p>
      <p>Timezone: {profile.timezone}</p>
    </section>
  )
}
