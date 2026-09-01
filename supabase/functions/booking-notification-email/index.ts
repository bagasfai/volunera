import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import type { Database } from "../../../lib/types/database.ts";
import {
  buildConfirmationEmails,
  buildCancellationEmails,
  toBookingForNotification,
  type EmailPayload,
} from "./notification-email.ts";

const RESEND_API_URL = "https://api.resend.com/emails";

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY")!;
  const from = Deno.env.get("EMAIL_FROM_ADDRESS")!;

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!response.ok) {
      console.error(
        "booking-notification-email send failed",
        response.status,
        await response.text(),
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("booking-notification-email send threw", error);
    return false;
  }
}

export default {
  fetch: withSupabase<Database>({ auth: "secret" }, async (req, ctx) => {
    let body: { action: "confirm" | "cancel"; bookingId: string };
    try {
      body = (await req.json()) as {
        action: "confirm" | "cancel";
        bookingId: string;
      };
    } catch {
      return Response.json({ error: "invalid request" }, { status: 400 });
    }
    const { action, bookingId } = body;

    if (!bookingId || (action !== "confirm" && action !== "cancel")) {
      return Response.json({ error: "invalid request" }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await ctx.supabaseAdmin
      .from("bookings")
      .select(
        "id, tutor_id, student_id, start_time, meet_link, topic, topic_category, confirmation_email_sent_at, cancellation_email_sent_at, subjects(label), grade_levels(label)",
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return Response.json({ error: "booking not found" }, { status: 404 });
    }

    if (action === "confirm" && booking.confirmation_email_sent_at) {
      return Response.json({ ok: true, skipped: true });
    }
    if (action === "cancel" && booking.cancellation_email_sent_at) {
      return Response.json({ ok: true, skipped: true });
    }

    const { data: profiles } = await ctx.supabaseAdmin
      .from("profiles")
      .select("id, first_name, email, timezone")
      .in("id", [booking.tutor_id, booking.student_id]);

    const tutorProfile = profiles?.find((p) => p.id === booking.tutor_id);
    const studentProfile = profiles?.find((p) => p.id === booking.student_id);

    if (!tutorProfile || !studentProfile) {
      return Response.json({ error: "profile not found" }, { status: 404 });
    }

    const bookingForNotification = toBookingForNotification(
      action,
      booking,
      tutorProfile,
      studentProfile,
    );

    const emails =
      action === "confirm"
        ? buildConfirmationEmails(bookingForNotification)
        : buildCancellationEmails(bookingForNotification);

    const [studentSent, tutorSent] = await Promise.all([
      sendEmail(emails.student),
      sendEmail(emails.tutor),
    ]);

    if (studentSent && tutorSent) {
      const column =
        action === "confirm"
          ? "confirmation_email_sent_at"
          : "cancellation_email_sent_at";

      const { error: guardUpdateError } = await ctx.supabaseAdmin
        .from("bookings")
        .update({ [column]: new Date().toISOString() })
        .eq("id", bookingId);

      if (guardUpdateError) {
        console.error(
          "booking-notification-email: DB guard-write update failed after sends succeeded",
          guardUpdateError,
        );
      }
    }

    return Response.json({ ok: true, studentSent, tutorSent });
  }),
};
