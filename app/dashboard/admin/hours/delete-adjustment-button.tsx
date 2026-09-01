"use client";

import { useActionState, useState } from "react";
import { deleteAdjustment, type AdjustmentState } from "@/lib/admin/hours-actions";

const INITIAL: AdjustmentState = {};

export function DeleteAdjustmentButton({ adjustmentId }: { adjustmentId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAdjustment, INITIAL);

  if (!confirming) {
    return (
      <>
        <button
          type="button"
          className="btn btn--quiet btn--sm"
          onClick={() => setConfirming(true)}
        >
          Delete
        </button>
        {state.error && (
          <p className="field__error" role="alert">
            {state.error}
          </p>
        )}
      </>
    );
  }

  return (
    <form action={formAction} className="inline-form">
      <input type="hidden" name="adjustmentId" value={adjustmentId} />
      <p className="field__hint">
        Delete this adjustment? There is no undo and the original entry and its
        filing date are gone for good.
      </p>
      <button type="submit" className="btn btn--danger btn--sm" disabled={pending}>
        {pending ? "Deleting…" : "Yes, delete it"}
      </button>
      <button
        type="button"
        className="btn btn--text btn--sm"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        Keep it
      </button>
      {state.error && (
        <p className="field__error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
