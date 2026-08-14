import type { Profile } from '@/lib/auth/dal'

export function TutorShell({ profile }: { profile: Profile }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Tutor dashboard</h2>
      <p>
        Hello, {profile.first_name}. Your volunteer application form arrives in
        Phase 2.
      </p>
      <p>Timezone: {profile.timezone}</p>
    </section>
  )
}
