"use client";

import { useActionState } from "react";
import { addAdjustment, type AdjustmentState } from "@/lib/admin/hours-actions";

const INITIAL: AdjustmentState = {};

export function AdjustmentForm({ tutorId }: { tutorId: string }) {
  const [state, formAction, pending] = useActionState(addAdjustment, INITIAL);

  return (
    <form action={formAction} className="form">
      <input type="hidden" name="tutorId" value={tutorId} />

      <label className="field">
        <span>Minutes</span>
        <input
          type="number"
          name="minutes"
          step="1"
          required
          className="control"
          aria-invalid={Boolean(state.fieldErrors?.minutes)}
        />
        <span className="field__hint">
          Negative to remove hours. Zero is not an adjustment.
        </span>
        {state.fieldErrors?.minutes && (
          <span className="field__error">{state.fieldErrors.minutes}</span>
        )}
      </label>

      <label className="field">
        <span>Reason</span>
        <textarea
          name="reason"
          rows={3}
          required
          maxLength={500}
          className="control"
          aria-invalid={Boolean(state.fieldErrors?.reason)}
        />
        {state.fieldErrors?.reason && (
          <span className="field__error">{state.fieldErrors.reason}</span>
        )}
      </label>

      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? "Filing…" : "File adjustment"}
        </button>
      </div>

      {state.error && (
        <p className="alert alert--error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
