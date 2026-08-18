"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-base font-medium">Weekly availability</h3>
        <p className="text-sm text-muted-foreground">
          Times are in your timezone ({timezone}).
        </p>
        {WEEKDAY_LABELS.map((label, weekday) => (
          <div key={weekday} className="flex flex-col gap-1 border-b pb-2">
            <span className="text-sm font-medium">{label}</span>
            <ul className="flex flex-col gap-1">
              {(windowsByWeekday.get(weekday) ?? []).map((slot) => (
                <li key={slot.id} className="flex items-center gap-2 text-sm">
                  <span>
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isRemoving}
                    onClick={() =>
                      startRemoving(() => {
                        void removeAvailabilityWindow(slot.id);
                      })
                    }
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <form action={addWindowAction} className="flex items-end gap-2">
              <input type="hidden" name="weekday" value={weekday} />
              <div className="flex flex-col gap-1">
                <Label htmlFor={`start-${weekday}`}>Start</Label>
                <Input
                  id={`start-${weekday}`}
                  name="startTime"
                  type="time"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`end-${weekday}`}>End</Label>
                <Input
                  id={`end-${weekday}`}
                  name="endTime"
                  type="time"
                  required
                />
              </div>
              <Button type="submit" size="sm" disabled={addWindowPending}>
                Add window
              </Button>
            </form>
          </div>
        ))}
        {windowState.error && (
          <p className="text-sm text-destructive">{windowState.error}</p>
        )}
        {windowState.fieldErrors?.endTime && (
          <p className="text-sm text-destructive">
            {windowState.fieldErrors.endTime}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-medium">Blocked dates</h3>
        <ul className="flex flex-col gap-1">
          {exceptions.map((exception) => (
            <li key={exception.id} className="flex items-center gap-2 text-sm">
              <span>
                {exception.exception_date}
                {exception.reason ? ` — ${exception.reason}` : ""}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isRemoving}
                onClick={() =>
                  startRemoving(() => {
                    void removeAvailabilityException(exception.id);
                  })
                }
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <form action={addExceptionAction} className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="exceptionDate">Block a date</Label>
            <Input
              id="exceptionDate"
              name="exceptionDate"
              type="date"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input id="reason" name="reason" type="text" maxLength={200} />
          </div>
          <Button type="submit" size="sm" disabled={addExceptionPending}>
            Block date
          </Button>
        </form>
        {exceptionState.error && (
          <p className="text-sm text-destructive">{exceptionState.error}</p>
        )}
        {exceptionState.fieldErrors?.exceptionDate && (
          <p className="text-sm text-destructive">
            {exceptionState.fieldErrors.exceptionDate}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-medium">Next 14 days, computed</h3>
        {upcomingSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No open windows in the next 14 days.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
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
