import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { BOOKING_STATUSES } from "@/lib/admin/booking-constants";

export type AdminBookingRow =
  Database["public"]["Views"]["admin_booking_details"]["Row"];

export type AdminBookingFilters = {
  status?: string;
  from?: string;
  to?: string;
};

export { BOOKING_STATUSES };

export const ADMIN_BOOKINGS_PAGE_SIZE = 200;

export type AdminBookingsResult = {
  rows: AdminBookingRow[];
  truncated: boolean;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseUtcDate(value: string): Date | null {
  if (!ISO_DATE_RE.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toInclusiveLowerBound(value: string): string | null {
  return parseUtcDate(value)?.toISOString() ?? null;
}

function toExclusiveUpperBound(value: string): string | null {
  const parsed = parseUtcDate(value);
  if (!parsed) return null;
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toISOString();
}

export async function listAllBookings(
  filters: AdminBookingFilters = {},
): Promise<AdminBookingsResult> {
  const supabase = await createClient();
  let query = supabase
    .from("admin_booking_details")
    .select("*")
    .order("start_time", { ascending: false })
    .limit(ADMIN_BOOKINGS_PAGE_SIZE + 1);

  if (
    filters.status &&
    (BOOKING_STATUSES as readonly string[]).includes(filters.status)
  ) {
    query = query.eq(
      "status",
      filters.status as Database["public"]["Enums"]["booking_status"],
    );
  }
  if (filters.from) {
    const lower = toInclusiveLowerBound(filters.from);
    if (lower) query = query.gte("start_time", lower);
  }
  if (filters.to) {
    const upper = toExclusiveUpperBound(filters.to);
    if (upper) query = query.lt("start_time", upper);
  }

  const { data } = await query;
  const all = (data ?? []) as AdminBookingRow[];
  return {
    rows: all.slice(0, ADMIN_BOOKINGS_PAGE_SIZE),
    truncated: all.length > ADMIN_BOOKINGS_PAGE_SIZE,
  };
}
