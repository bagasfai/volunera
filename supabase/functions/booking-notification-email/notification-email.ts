export type PersonForNotification = {
  firstName: string;
  email: string;
  timezone: string;
};

export type BookingForNotification = {
  id: string;
  startTime: string;
  subjectLabel: string;
  gradeLevelLabel: string;
  topicCategory: string;
  topic: string;
  meetLink: string | null;
  tutor: PersonForNotification;
  student: PersonForNotification;
};

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type BookingRowForMapping = {
  id: string;
  start_time: string;
  meet_link: string | null;
  topic: string;
  topic_category: string;
  subjects: { label: string } | null;
  grade_levels: { label: string } | null;
};

export type ProfileForMapping = {
  first_name: string;
  email: string;
  timezone: string;
};

export function toBookingForNotification(
  action: "confirm" | "cancel",
  booking: BookingRowForMapping,
  tutorProfile: ProfileForMapping,
  studentProfile: ProfileForMapping,
): BookingForNotification {
  return {
    id: booking.id,
    startTime: booking.start_time,
    subjectLabel: booking.subjects?.label ?? "",
    gradeLevelLabel: booking.grade_levels?.label ?? "",
    topicCategory: booking.topic_category,
    topic: booking.topic,
    meetLink: action === "confirm" ? booking.meet_link : null,
    tutor: {
      firstName: tutorProfile.first_name,
      email: tutorProfile.email,
      timezone: tutorProfile.timezone,
    },
    student: {
      firstName: studentProfile.first_name,
      email: studentProfile.email,
      timezone: studentProfile.timezone,
    },
  };
}

export function formatSessionTime(isoTime: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(isoTime));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function linesToHtml(lines: string[], meetLink: string | null): string {
  return lines
    .map((line) => {
      if (line === "") {
        return "<br>";
      }
      if (meetLink && line === `Join link: ${meetLink}`) {
        const escapedMeetLink = escapeHtml(meetLink);
        return `<p>Join link: <a href="${escapedMeetLink}">${escapedMeetLink}</a></p>`;
      }
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");
}

function confirmationLines(
  booking: BookingForNotification,
  recipient: "student" | "tutor",
): string[] {
  const sessionTime = formatSessionTime(
    booking.startTime,
    booking[recipient].timezone,
  );
  const otherFirstName =
    recipient === "student" ? booking.tutor.firstName : booking.student.firstName;
  const otherLabel = recipient === "student" ? "Tutor" : "Student";

  const lines = [
    recipient === "student"
      ? "Your tutoring session is confirmed!"
      : "You have a new tutoring session booked!",
    "",
    `${otherLabel}: ${otherFirstName}`,
    `Subject: ${booking.subjectLabel}`,
    `Grade: ${booking.gradeLevelLabel}`,
    `Topic (${booking.topicCategory}): ${booking.topic}`,
    `When: ${sessionTime}`,
  ];

  if (booking.meetLink) {
    lines.push(`Join link: ${booking.meetLink}`);
  }

  return lines;
}

function cancellationLines(
  booking: BookingForNotification,
  recipient: "student" | "tutor",
): string[] {
  const sessionTime = formatSessionTime(
    booking.startTime,
    booking[recipient].timezone,
  );
  const otherFirstName =
    recipient === "student" ? booking.tutor.firstName : booking.student.firstName;
  const otherLabel = recipient === "student" ? "Tutor" : "Student";

  return [
    recipient === "student"
      ? "Your tutoring session has been canceled."
      : "A tutoring session has been canceled.",
    "",
    `${otherLabel}: ${otherFirstName}`,
    `Subject: ${booking.subjectLabel}`,
    `Grade: ${booking.gradeLevelLabel}`,
    `Topic (${booking.topicCategory}): ${booking.topic}`,
    `Was scheduled: ${sessionTime}`,
  ];
}

export function buildConfirmationEmails(
  booking: BookingForNotification,
): { student: EmailPayload; tutor: EmailPayload } {
  const studentLines = confirmationLines(booking, "student");
  const tutorLines = confirmationLines(booking, "tutor");

  return {
    student: {
      to: booking.student.email,
      subject: `Your session is confirmed: ${booking.subjectLabel}`,
      text: studentLines.join("\n"),
      html: linesToHtml(studentLines, booking.meetLink),
    },
    tutor: {
      to: booking.tutor.email,
      subject: `New session booked: ${booking.subjectLabel}`,
      text: tutorLines.join("\n"),
      html: linesToHtml(tutorLines, booking.meetLink),
    },
  };
}

export function buildCancellationEmails(
  booking: BookingForNotification,
): { student: EmailPayload; tutor: EmailPayload } {
  const studentLines = cancellationLines(booking, "student");
  const tutorLines = cancellationLines(booking, "tutor");

  return {
    student: {
      to: booking.student.email,
      subject: `Session canceled: ${booking.subjectLabel}`,
      text: studentLines.join("\n"),
      html: linesToHtml(studentLines, null),
    },
    tutor: {
      to: booking.tutor.email,
      subject: `Session canceled: ${booking.subjectLabel}`,
      text: tutorLines.join("\n"),
      html: linesToHtml(tutorLines, null),
    },
  };
}
