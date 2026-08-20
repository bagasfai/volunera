function normalizeSpaces(value: string): string {
  return value.replace(/[  ]/g, " ");
}

export function formatSessionDate(iso: string, timezone: string): string {
  return normalizeSpaces(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date(iso)),
  );
}

export function formatSessionTime(iso: string, timezone: string): string {
  return normalizeSpaces(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso)),
  );
}

export function formatSessionRange(
  startIso: string,
  endIso: string,
  timezone: string,
): string {
  const date = formatSessionDate(startIso, timezone);
  const start = formatSessionTime(startIso, timezone);
  const end = formatSessionTime(endIso, timezone);
  return `${date} · ${start} – ${end}`;
}

export function formatMinutesAsHours(minutes: number): string {
  const total = Math.round(minutes);
  if (total === 0) return "0m";

  const sign = total < 0 ? "-" : "";
  const absolute = Math.abs(total);
  const hours = Math.floor(absolute / 60);
  const rest = absolute % 60;

  if (hours === 0) return `${sign}${rest}m`;
  if (rest === 0) return `${sign}${hours}h`;
  return `${sign}${hours}h ${rest}m`;
}
