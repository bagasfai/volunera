import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import type { Database } from "../../../lib/types/database.ts";
import {
  buildCalendarEventPayload,
  parseCalendarEventResponse,
  type BookingForCalendar,
} from "./calendar-event.ts";
import { refreshGoogleAccessToken } from "./google-auth.ts";

const GOOGLE_CALENDAR_ID = "primary";

function googleEnv() {
  return {
    clientId: Deno.env.get("GOOGLE_CLIENT_ID")!,
    clientSecret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
    refreshToken: Deno.env.get("GOOGLE_REFRESH_TOKEN")!,
  };
}

export default {
  fetch: withSupabase<Database>({ auth: "secret" }, async (req, ctx) => {
    let body: { action: "create" | "cancel"; bookingId: string };
    try {
      body = (await req.json()) as {
        action: "create" | "cancel";
        bookingId: string;
      };
    } catch {
      return Response.json({ error: "invalid request" }, { status: 400 });
    }
    const { action, bookingId } = body;

    if (!bookingId || (action !== "create" && action !== "cancel")) {
      return Response.json({ error: "invalid request" }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await ctx.supabaseAdmin
      .from("bookings")
      .select(
        "id, tutor_id, student_id, start_time, end_time, topic, topic_category, calendar_event_id, meet_link, subjects(label), grade_levels(label)",
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return Response.json({ error: "booking not found" }, { status: 404 });
    }

    if (action === "cancel") {
      if (!booking.calendar_event_id) {
        return Response.json({ ok: true });
      }

      try {
        const accessToken = await refreshGoogleAccessToken(googleEnv());
        const deleteResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${GOOGLE_CALENDAR_ID}/events/${encodeURIComponent(booking.calendar_event_id)}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (
          !deleteResponse.ok &&
          deleteResponse.status !== 404 &&
          deleteResponse.status !== 410
        ) {
          throw new Error(
            `Google event delete failed: ${deleteResponse.status}`,
          );
        }
      } catch (error) {
        console.error("booking-calendar-event cancel failed", error);
        return Response.json(
          { error: "calendar_cancel_failed" },
          { status: 502 },
        );
      }

      const { error: cancelUpdateError } = await ctx.supabaseAdmin
        .from("bookings")
        .update({ calendar_event_id: null, meet_link: null })
        .eq("id", bookingId);

      if (cancelUpdateError) {
        console.error(
          "booking-calendar-event cancel: DB update failed after Google event deletion",
          cancelUpdateError,
        );
      }

      return Response.json({ ok: true });
    }

    if (booking.calendar_event_id) {
      return Response.json({
        calendarEventId: booking.calendar_event_id,
        meetLink: booking.meet_link,
      });
    }

    const { data: profiles } = await ctx.supabaseAdmin
      .from("profiles")
      .select("id, first_name")
      .in("id", [booking.tutor_id, booking.student_id]);

    const tutorFirstName =
      profiles?.find((p) => p.id === booking.tutor_id)?.first_name ?? "Tutor";
    const studentFirstName =
      profiles?.find((p) => p.id === booking.student_id)?.first_name ??
      "Student";

    const bookingForCalendar: BookingForCalendar = {
      id: booking.id,
      startTime: booking.start_time,
      endTime: booking.end_time,
      subjectLabel: booking.subjects?.label ?? "",
      gradeLevelLabel: booking.grade_levels?.label ?? "",
      topicCategory: booking.topic_category,
      topic: booking.topic,
      tutorFirstName,
      studentFirstName,
    };

    try {
      const accessToken = await refreshGoogleAccessToken(googleEnv());
      const createResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${GOOGLE_CALENDAR_ID}/events?conferenceDataVersion=1`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildCalendarEventPayload(bookingForCalendar)),
        },
      );

      if (!createResponse.ok) {
        throw new Error(`Google event create failed: ${createResponse.status}`);
      }

      const result = parseCalendarEventResponse(await createResponse.json());

      const { error: createUpdateError } = await ctx.supabaseAdmin
        .from("bookings")
        .update({
          calendar_event_id: result.calendarEventId,
          meet_link: result.meetLink,
        })
        .eq("id", bookingId);

      if (createUpdateError) {
        console.error(
          "booking-calendar-event create: DB update failed after Google event creation",
          createUpdateError,
        );
        return Response.json(
          { error: "calendar_create_failed" },
          { status: 502 },
        );
      }

      return Response.json(result);
    } catch (error) {
      console.error("booking-calendar-event create failed", error);
      return Response.json(
        { error: "calendar_create_failed" },
        { status: 502 },
      );
    }
  }),
};
