import { requireProfile } from '@/lib/auth/dal'
import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { AdminShell } from './_shells/admin-shell'
import { StudentShell } from './_shells/student-shell'
import { TutorShell } from './_shells/tutor-shell'

export default async function DashboardPage() {
  // Redirects to /login without a session, /onboarding without a profile.
  const profile = await requireProfile()

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Learnivia</h1>
        <form action={signOut}>
          <Button type="submit">Sign out</Button>
        </form>
      </header>

      {profile.role === 'student' && <StudentShell profile={profile} />}
      {profile.role === 'tutor' && <TutorShell profile={profile} />}
      {profile.role === 'admin' && <AdminShell profile={profile} />}
    </main>
  )
}
