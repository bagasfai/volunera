import { assertEquals } from "jsr:@std/assert@1";
import {
  buildCalendarEventPayload,
  parseCalendarEventResponse,
} from "./calendar-event.ts";

const sampleBooking = {
  id: "b0000000-0000-0000-0000-000000000001",
  startTime: "2026-09-01T16:00:00.000Z",
  endTime: "2026-09-01T16:45:00.000Z",
  subjectLabel: "Algebra I",
  gradeLevelLabel: "9th Grade",
  topicCategory: "homework",
  topic: "Fractions",
  tutorFirstName: "Dev",
  studentFirstName: "Ada",
};

Deno.test("buildCalendarEventPayload sets no attendees field", () => {
  const payload = buildCalendarEventPayload(sampleBooking);
  assertEquals("attendees" in payload, false);
});

Deno.test(
  "buildCalendarEventPayload uses UTC start/end and the booking id as requestId",
  () => {
    const payload = buildCalendarEventPayload(sampleBooking);
    assertEquals(payload.start.dateTime, "2026-09-01T16:00:00.000Z");
    assertEquals(payload.end.dateTime, "2026-09-01T16:45:00.000Z");
    assertEquals(
      payload.conferenceData.createRequest.requestId,
      sampleBooking.id,
    );
    assertEquals(
      payload.conferenceData.createRequest.conferenceSolutionKey.type,
      "hangoutsMeet",
    );
  },
);

Deno.test(
  "buildCalendarEventPayload includes subject in summary, names/topic in description, no emails",
  () => {
    const payload = buildCalendarEventPayload(sampleBooking);
    assertEquals(payload.summary, "Learnivia session: Algebra I");
    assertEquals(payload.description.includes("Dev"), true);
    assertEquals(payload.description.includes("Ada"), true);
    assertEquals(payload.description.includes("Fractions"), true);
    assertEquals(payload.description.includes("@"), false);
  },
);

Deno.test(
  "parseCalendarEventResponse extracts event id and the video entry point uri",
  () => {
    const result = parseCalendarEventResponse({
      id: "google-event-123",
      conferenceData: {
        entryPoints: [
          {
            entryPointType: "video",
            uri: "https://meet.google.com/abc-defg-hij",
          },
          { entryPointType: "more", uri: "https://tel.meet/abc-defg-hij" },
        ],
      },
    });
    assertEquals(result.calendarEventId, "google-event-123");
    assertEquals(result.meetLink, "https://meet.google.com/abc-defg-hij");
  },
);

Deno.test(
  "parseCalendarEventResponse returns null meetLink when no video entry point exists",
  () => {
    const result = parseCalendarEventResponse({ id: "google-event-456" });
    assertEquals(result.calendarEventId, "google-event-456");
    assertEquals(result.meetLink, null);
  },
);
