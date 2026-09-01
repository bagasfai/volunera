"use client";

import { useActionState, useSyncExternalStore } from "react";
import {
  completeOnboarding,
  type OnboardingState,
} from "@/lib/auth/onboarding-actions";

const initialState: OnboardingState = {};

function subscribeToNothing() {
  return () => {};
}

function getTimezoneSnapshot() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function getServerTimezoneSnapshot() {
  return "UTC";
}

export function OnboardingForm({
  defaultFirstName,
  defaultLastName,
}: {
  defaultFirstName: string;
  defaultLastName: string;
}) {
  const [state, formAction, pending] = useActionState(
    completeOnboarding,
    initialState,
  );
  const timezone = useSyncExternalStore(
    subscribeToNothing,
    getTimezoneSnapshot,
    getServerTimezoneSnapshot,
  );

  return (
    <form action={formAction} className="form">
      <input type="hidden" name="timezone" value={timezone} />

      <fieldset
        className="fieldset"
        aria-describedby={state.fieldErrors?.role ? "role-error" : undefined}
      >
        <legend className="fieldset__legend">I am here to…</legend>
        <div className="choice-grid">
          <label className="choice choice--block">
            {
              // eslint-disable-next-line jsx-a11y/role-supports-aria-props
              <input
                type="radio"
                name="role"
                value="student"
                defaultChecked
                aria-invalid={state.fieldErrors?.role ? true : undefined}
              />
            }
            <span>Find a tutor (student or parent)</span>
          </label>
          <label className="choice choice--block">
            {
              // eslint-disable-next-line jsx-a11y/role-supports-aria-props
              <input
                type="radio"
                name="role"
                value="tutor"
                aria-invalid={state.fieldErrors?.role ? true : undefined}
              />
            }
            <span>Volunteer as a tutor</span>
          </label>
        </div>
        {state.fieldErrors?.role && (
          <p id="role-error" role="alert" className="field__error">
            {state.fieldErrors.role}
          </p>
        )}
      </fieldset>

      <div className="form__row form__row--2">
        <div className="field">
          <label htmlFor="firstName">First name</label>
          <input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            defaultValue={defaultFirstName}
            required
            aria-invalid={state.fieldErrors?.firstName ? true : undefined}
            aria-describedby={
              state.fieldErrors?.firstName ? "firstName-error" : undefined
            }
          />
          {state.fieldErrors?.firstName && (
            <p id="firstName-error" role="alert" className="field__error">
              {state.fieldErrors.firstName}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="lastName">Last name</label>
          <input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            defaultValue={defaultLastName}
            required
            aria-invalid={state.fieldErrors?.lastName ? true : undefined}
            aria-describedby={
              state.fieldErrors?.lastName ? "lastName-error" : undefined
            }
          />
          {state.fieldErrors?.lastName && (
            <p id="lastName-error" role="alert" className="field__error">
              {state.fieldErrors.lastName}
            </p>
          )}
        </div>
      </div>

      <p className="field__hint">
        Times are shown in your timezone: <strong>{timezone}</strong>
      </p>
      {state.fieldErrors?.timezone && (
        <p role="alert" className="field__error">
          {state.fieldErrors.timezone}
        </p>
      )}

      {state.error && (
        <p role="alert" className="alert alert--error">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn--primary btn--block"
        disabled={pending}
      >
        {pending ? "Setting up…" : "Finish setting up"}
      </button>
    </form>
  );
}
