'use client'

import { useActionState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  completeOnboarding,
  type OnboardingState,
} from '@/lib/auth/onboarding-actions'

const initialState: OnboardingState = {}

// No change events to subscribe to — the browser's timezone does not shift
// mid-session — so this is a no-op subscription used purely to let
// useSyncExternalStore give us a hydration-safe read of a browser-only API.
function subscribeToNothing() {
  return () => {}
}

function getTimezoneSnapshot() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

function getServerTimezoneSnapshot() {
  return 'UTC'
}

export function OnboardingForm({
  defaultFirstName,
  defaultLastName,
}: {
  defaultFirstName: string
  defaultLastName: string
}) {
  const [state, formAction, pending] = useActionState(
    completeOnboarding,
    initialState,
  )
  // Read on the client so the value reflects the user's device, not the
  // server's. Stored as an IANA name; Phase 3 depends on it being real.
  // useSyncExternalStore (rather than a state-setting effect) renders the
  // SSR-safe 'UTC' fallback on the server and first client paint, then
  // swaps in the real snapshot without a hydration mismatch.
  const timezone = useSyncExternalStore(
    subscribeToNothing,
    getTimezoneSnapshot,
    getServerTimezoneSnapshot,
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="timezone" value={timezone} />

      <fieldset
        className="flex flex-col gap-2"
        aria-describedby={state.fieldErrors?.role ? 'role-error' : undefined}
      >
        <legend className="text-sm font-medium">I am here to…</legend>
        <RadioGroup
          name="role"
          defaultValue="student"
          aria-invalid={state.fieldErrors?.role ? true : undefined}
        >
          <Label className="flex items-center gap-2 font-normal">
            <RadioGroupItem
              value="student"
              aria-invalid={state.fieldErrors?.role ? true : undefined}
            />
            <span>Find a tutor (student or parent)</span>
          </Label>
          <Label className="flex items-center gap-2 font-normal">
            <RadioGroupItem
              value="tutor"
              aria-invalid={state.fieldErrors?.role ? true : undefined}
            />
            <span>Volunteer as a tutor</span>
          </Label>
        </RadioGroup>
        {state.fieldErrors?.role && (
          <p id="role-error" role="alert" className="text-sm text-destructive">
            {state.fieldErrors.role}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="firstName">First name</Label>
        <Input
          id="firstName"
          name="firstName"
          autoComplete="given-name"
          defaultValue={defaultFirstName}
          required
          aria-invalid={state.fieldErrors?.firstName ? true : undefined}
          aria-describedby={
            state.fieldErrors?.firstName ? 'firstName-error' : undefined
          }
        />
        {state.fieldErrors?.firstName && (
          <p
            id="firstName-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {state.fieldErrors.firstName}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="lastName">Last name</Label>
        <Input
          id="lastName"
          name="lastName"
          autoComplete="family-name"
          defaultValue={defaultLastName}
          required
          aria-invalid={state.fieldErrors?.lastName ? true : undefined}
          aria-describedby={
            state.fieldErrors?.lastName ? 'lastName-error' : undefined
          }
        />
        {state.fieldErrors?.lastName && (
          <p
            id="lastName-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {state.fieldErrors.lastName}
          </p>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Your timezone: {timezone}
      </p>
      {state.fieldErrors?.timezone && (
        <p role="alert" className="text-sm text-destructive">
          {state.fieldErrors.timezone}
        </p>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Setting up…' : 'Finish setting up'}
      </Button>
    </form>
  )
}
