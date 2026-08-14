import Link from 'next/link'
import { safeNextPath } from '@/lib/auth/safe-redirect'
import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">Sign in to Learnivia</h1>
      <LoginForm next={safeNextPath(next)} />
      <p>
        No account? <Link href="/signup">Create one</Link>
      </p>
    </main>
  )
}
