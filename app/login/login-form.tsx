"use client";

import { useActionState } from "react";
import { signIn, signInWithGoogle, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <div>
      <form action={formAction} className="form">
        <input type="hidden" name="next" value={next} />

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
            autoComplete="current-password"
            required
            aria-invalid={state.fieldErrors?.password ? true : undefined}
            aria-describedby={
              state.fieldErrors?.password ? "password-error" : undefined
            }
          />
          {state.fieldErrors?.password && (
            <p id="password-error" role="alert" className="field__error">
              {state.fieldErrors.password}
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
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="auth__divider">or</p>

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button type="submit" className="btn btn--quiet btn--block">
          Continue with Google
        </button>
      </form>
    </div>
  );
}
