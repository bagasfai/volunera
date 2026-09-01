"use client";

import { useActionState, useTransition } from "react";
import { X } from "lucide-react";
import {
  addAvailabilityException,
  addAvailabilityWindow,
  removeAvailabilityException,
  removeAvailabilityWindow,
  type AvailabilityActionState,
} from "@/lib/tutor/availability-actions";
import type {
  AvailabilityException,
  AvailabilityWindow,
  UpcomingSlot,
} from "@/lib/tutor/availability-dal";

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const initialState: AvailabilityActionState = {};

function formatLocalRange(isoStart: string, isoEnd: string, timezone: string) {
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateFormatter.format(new Date(isoStart))} – ${timeFormatter.format(new Date(isoEnd))}`;
}

export function TutorAvailabilityEditor({
  windows,
  exceptions,
  upcomingSlots,
  timezone,
}: {
  windows: AvailabilityWindow[];
  exceptions: AvailabilityException[];
  upcomingSlots: UpcomingSlot[];
  timezone: string;
}) {
  const [windowState, addWindowAction, addWindowPending] = useActionState(
    addAvailabilityWindow,
    initialState,
  );
  const [exceptionState, addExceptionAction, addExceptionPending] =
    useActionState(addAvailabilityException, initialState);
  const [isRemoving, startRemoving] = useTransition();

  const windowsByWeekday = new Map<number, AvailabilityWindow[]>();
  for (const slot of windows) {
    const existing = windowsByWeekday.get(slot.weekday) ?? [];
    existing.push(slot);
    windowsByWeekday.set(slot.weekday, existing);
  }

  return (
    <div className="stack" style={{ gap: "var(--space-xl)" }}>
      <section className="stack">
        <p className="field__hint" style={{ margin: 0 }}>
          All times are in your timezone ({timezone}).
        </p>

        {(windowState.error || windowState.fieldErrors?.endTime) && (
          <p role="alert" className="alert alert--error">
            {windowState.error ?? windowState.fieldErrors?.endTime}
          </p>
        )}

        <div className="stack" style={{ gap: "var(--space-sm)" }}>
          {WEEKDAY_LABELS.map((label, weekday) => {
            const dayWindows = windowsByWeekday.get(weekday) ?? [];
            return (
              <div key={weekday} className="day-group">
                <span className="day-group__label">{label}</span>

                {dayWindows.length === 0 ? (
                  <p className="field__hint" style={{ margin: 0 }}>
                    Not available
                  </p>
                ) : (
                  <ul className="slot-list">
                    {dayWindows.map((slot) => (
                      <li
                        key={slot.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        {slot.start_time.slice(0, 5)} –{" "}
                        {slot.end_time.slice(0, 5)}
                        <button
                          type="button"
                          className="chip-remove"
                          disabled={isRemoving}
                          onClick={() =>
                            startRemoving(() => {
                              void removeAvailabilityWindow(slot.id);
                            })
                          }
                        >
                          <X size={13} aria-hidden="true" />
                          <span className="sr-only">
                            Remove {label} {slot.start_time.slice(0, 5)} window
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <form action={addWindowAction} className="inline-form">
                  <input type="hidden" name="weekday" value={weekday} />
                  <div className="field">
                    <label htmlFor={`start-${weekday}`}>Start</label>
                    <input
                      id={`start-${weekday}`}
                      name="startTime"
                      type="time"
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`end-${weekday}`}>End</label>
                    <input
                      id={`end-${weekday}`}
                      name="endTime"
                      type="time"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn--quiet btn--sm"
                    disabled={addWindowPending}
                  >
                    Add window
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </section>

      <section className="stack">
        <h3 style={{ fontSize: "var(--text-md)" }}>Blocked dates</h3>

        {exceptions.length === 0 ? (
          <p className="field__hint" style={{ margin: 0 }}>
            No blocked dates. Weekly hours apply every week.
          </p>
        ) : (
          <ul className="slot-list">
            {exceptions.map((exception) => (
              <li
                key={exception.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                {exception.exception_date}
                {exception.reason ? ` - ${exception.reason}` : ""}
                <button
                  type="button"
                  className="chip-remove"
                  disabled={isRemoving}
                  onClick={() =>
                    startRemoving(() => {
                      void removeAvailabilityException(exception.id);
                    })
                  }
                >
                  <X size={13} aria-hidden="true" />
                  <span className="sr-only">
                    Unblock {exception.exception_date}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {(exceptionState.error ||
          exceptionState.fieldErrors?.exceptionDate) && (
          <p role="alert" className="alert alert--error">
            {exceptionState.error ??
              exceptionState.fieldErrors?.exceptionDate}
          </p>
        )}

        <form action={addExceptionAction} className="inline-form">
          <div className="field">
            <label htmlFor="exceptionDate">Block a date</label>
            <input
              id="exceptionDate"
              name="exceptionDate"
              type="date"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="reason">Reason (optional)</label>
            <input id="reason" name="reason" type="text" maxLength={200} />
          </div>
          <button
            type="submit"
            className="btn btn--quiet btn--sm"
            disabled={addExceptionPending}
          >
            Block date
          </button>
        </form>
      </section>

      <section className="stack">
        <h3 style={{ fontSize: "var(--text-md)" }}>
          What students will see in next 14 days
        </h3>
        {upcomingSlots.length === 0 ? (
          <p className="field__hint" style={{ margin: 0 }}>
            No open windows in the next 14 days.
          </p>
        ) : (
          <ul className="slot-list">
            {upcomingSlots.map((slot) => (
              <li key={`${slot.slotStart}-${slot.slotEnd}`}>
                {formatLocalRange(slot.slotStart, slot.slotEnd, timezone)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
