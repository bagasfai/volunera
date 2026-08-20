export type BookingForCalendar = {
  id: string;
  startTime: string;
  endTime: string;
  subjectLabel: string;
  gradeLevelLabel: string;
  topicCategory: string;
  topic: string;
  tutorFirstName: string;
  studentFirstName: string;
};

export type GoogleEventPayload = {
  summary: string;
  description: string;
  start: { dateTime: string };
  end: { dateTime: string };
  conferenceData: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: { type: "hangoutsMeet" };
    };
  };
};

export function buildCalendarEventPayload(
  booking: BookingForCalendar,
): GoogleEventPayload {
  return {
    summary: `Learnivia session: ${booking.subjectLabel}`,
    description: [
      `Tutor: ${booking.tutorFirstName}`,
      `Student: ${booking.studentFirstName}`,
      `Grade: ${booking.gradeLevelLabel}`,
      `Topic category: ${booking.topicCategory}`,
      `Topic: ${booking.topic}`,
    ].join("\n"),
    start: { dateTime: booking.startTime },
    end: { dateTime: booking.endTime },
    conferenceData: {
      createRequest: {
        requestId: booking.id,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };
}

export type CalendarEventResult = {
  calendarEventId: string;
  meetLink: string | null;
};

export function parseCalendarEventResponse(json: unknown): CalendarEventResult {
  const response = json as {
    id: string;
    conferenceData?: {
      entryPoints?: Array<{ entryPointType: string; uri: string }>;
    };
  };
  const videoEntryPoint = response.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video",
  );
  return {
    calendarEventId: response.id,
    meetLink: videoEntryPoint?.uri ?? null,
  };
}
