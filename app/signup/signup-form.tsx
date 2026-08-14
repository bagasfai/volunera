'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUp, signInWithGoogle, type AuthState } from '@/lib/auth/actions'

const initialState: AuthState = {}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState)

  return (
    <div className="flex flex-col gap-3">
      {state.message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {state.message}
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={state.fieldErrors?.email ? true : undefined}
              aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
            />
            {state.fieldErrors?.email && (
              <p id="email-error" role="alert" className="text-sm text-destructive">
                {state.fieldErrors.email}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              aria-invalid={state.fieldErrors?.password ? true : undefined}
              aria-describedby={state.fieldErrors?.password ? 'password-error' : undefined}
            />
            {state.fieldErrors?.password && (
              <p id="password-error" role="alert" className="text-sm text-destructive">
                {state.fieldErrors.password}
              </p>
            )}
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      )}

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value="/onboarding" />
        <Button type="submit" variant="outline" className="w-full">
          Continue with Google
        </Button>
      </form>
    </div>
  )
}
