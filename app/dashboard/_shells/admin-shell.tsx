import type { Profile } from '@/lib/auth/dal'

export function AdminShell({ profile }: { profile: Profile }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Admin dashboard</h2>
      <p>
        Hello, {profile.first_name}. The review queue and lookup management
        arrive in Phase 2.
      </p>
    </section>
  )
}
