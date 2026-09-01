"use client";

import { useActionState } from "react";
import {
  setBookingStatus,
  type BookingStatusState,
} from "@/lib/admin/booking-actions";
import { BOOKING_STATUSES } from "@/lib/admin/booking-constants";

const INITIAL: BookingStatusState = {};

export function BookingStatusForm({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: string;
}) {
  const [state, formAction, pending] = useActionState(setBookingStatus, INITIAL);

  return (
    <form action={formAction} className="inline-form">
      <input type="hidden" name="bookingId" value={bookingId} />
      <select
        name="status"
        defaultValue={currentStatus}
        className="control"
        aria-label="Booking status"
      >
        {BOOKING_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status.replace("_", " ")}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn--quiet btn--sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
      {state.error && (
        <p className="field__error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
