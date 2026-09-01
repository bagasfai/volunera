"use client";

import { useActionState, useState } from "react";
import { cancelBooking, type CancelState } from "@/lib/booking/cancel-actions";

const INITIAL: CancelState = {};

export function CancelBookingButton({
  bookingId,
  revalidatePath,
}: {
  bookingId: string;
  revalidatePath: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(cancelBooking, INITIAL);

  if (!confirming) {
    return (
      <>
        <button
          type="button"
          className="btn btn--quiet btn--sm"
          onClick={() => setConfirming(true)}
        >
          Cancel session
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
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="revalidate" value={revalidatePath} />
      <p className="field__hint">
        Cancel this session? Everyone involved is emailed, and the Google Meet
        link stops working.
      </p>
      <button type="submit" className="btn btn--danger btn--sm" disabled={pending}>
        {pending ? "Canceling…" : "Yes, cancel it"}
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
