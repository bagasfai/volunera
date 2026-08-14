import { redirect } from 'next/navigation'
import { getUser, getProfile } from '@/lib/auth/dal'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  // Already onboarded — nothing to do here.
  const profile = await getProfile()
  if (profile) redirect('/dashboard')

  // Google supplies a full name; email/password signups supply nothing.
  // Display only — never an authorization input.
  const metadata = user.user_metadata as
    | { full_name?: string }
    | undefined
  const fullName = metadata?.full_name ?? ''
  const [first = '', ...rest] = fullName.split(' ').filter(Boolean)

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">Welcome to Learnivia</h1>
      <p>Tell us how you will be using Learnivia.</p>
      <OnboardingForm
        defaultFirstName={first}
        defaultLastName={rest.join(' ')}
      />
    </main>
  )
}
