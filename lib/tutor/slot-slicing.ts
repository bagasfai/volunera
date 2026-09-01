export type SlotWindow = { slotStart: string; slotEnd: string };

export function sliceIntoBookableStarts(
  windows: SlotWindow[],
  durationMinutes: number,
): string[] {
  const durationMs = durationMinutes * 60 * 1000;
  const starts: string[] = [];

  for (const window of windows) {
    let cursor = new Date(window.slotStart).getTime();
    const end = new Date(window.slotEnd).getTime();

    while (cursor + durationMs <= end) {
      starts.push(new Date(cursor).toISOString());
      cursor += durationMs;
    }
  }

  return starts;
}
