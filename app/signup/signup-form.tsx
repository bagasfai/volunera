"use client";

import { useActionState } from "react";
import { signUp, signInWithGoogle, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <div>
      {state.message ? (
        <p role="status" className="alert alert--ok">
          {state.message}
        </p>
      ) : (
        <form action={formAction} className="form">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={state.fieldErrors?.email ? true : undefined}
              aria-describedby={
                state.fieldErrors?.email ? "email-error" : undefined
              }
            />
            {state.fieldErrors?.email && (
              <p id="email-error" role="alert" className="field__error">
                {state.fieldErrors.email}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              aria-invalid={state.fieldErrors?.password ? true : undefined}
              aria-describedby={
                state.fieldErrors?.password
                  ? "password-error"
                  : "password-hint"
              }
            />
            {state.fieldErrors?.password ? (
              <p id="password-error" role="alert" className="field__error">
                {state.fieldErrors.password}
              </p>
            ) : (
              <p id="password-hint" className="field__hint">
                At least 8 characters.
              </p>
            )}
          </div>

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
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}

      <p className="auth__divider">or</p>

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value="/onboarding" />
        <button type="submit" className="btn btn--quiet btn--block">
          Continue with Google
        </button>
      </form>
    </div>
  );
}
