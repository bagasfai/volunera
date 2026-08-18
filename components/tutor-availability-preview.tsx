"use client";

import { useSyncExternalStore } from "react";

function subscribeToNothing() {
  return () => {};
}

function getClientTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getServerTimezone() {
  return null;
}

function formatSlot(isoStart: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoStart));
}

function groupByLocalDate(
  slots: { slotStart: string; slotEnd: string }[],
  timezone: string,
) {
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  });

  const groups = new Map<string, { start: string; end: string }[]>();
  for (const slot of slots) {
    const label = dateFormatter.format(new Date(slot.slotStart));
    const entry = {
      start: timeFormatter.format(new Date(slot.slotStart)),
      end: timeFormatter.format(new Date(slot.slotEnd)),
    };
    const existing = groups.get(label) ?? [];
    existing.push(entry);
    groups.set(label, existing);
  }
  return groups;
}

export function TutorAvailabilityPreview({
  slots,
  variant,
}: {
  slots: { slotStart: string; slotEnd: string }[];
  variant: "compact" | "full";
}) {
  const timezone = useSyncExternalStore(
    subscribeToNothing,
    getClientTimezone,
    getServerTimezone,
  );

  if (!timezone) {
    return (
      <p className="text-sm text-muted-foreground">Loading availability…</p>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No upcoming availability</p>
    );
  }

  if (variant === "compact") {
    return (
      <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
        {slots.slice(0, 3).map((slot) => (
          <li key={slot.slotStart}>{formatSlot(slot.slotStart, timezone)}</li>
        ))}
      </ul>
    );
  }

  const groups = groupByLocalDate(slots, timezone);
  return (
    <div className="flex flex-col gap-3">
      {Array.from(groups.entries()).map(([date, entries]) => (
        <div key={date} className="flex flex-col gap-1">
          <span className="text-sm font-medium">{date}</span>
          <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
            {entries.map((entry) => (
              <li key={entry.start}>
                {entry.start} – {entry.end}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
