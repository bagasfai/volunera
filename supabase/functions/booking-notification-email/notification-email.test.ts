import { assertEquals } from "jsr:@std/assert@1";
import {
  buildConfirmationEmails,
  buildCancellationEmails,
  formatSessionTime,
  toBookingForNotification,
  type BookingForNotification,
  type BookingRowForMapping,
  type ProfileForMapping,
} from "./notification-email.ts";

const sampleBooking: BookingForNotification = {
  id: "b0000000-0000-0000-0000-000000000002",
  startTime: "2026-09-01T16:00:00.000Z",
  subjectLabel: "Algebra I",
  gradeLevelLabel: "9th Grade",
  topicCategory: "homework",
  topic: "Fractions & <exponents>",
  meetLink: "https://meet.google.com/abc-defg-hij",
  tutor: { firstName: "Dev", email: "tutor@example.com", timezone: "America/Los_Angeles" },
  student: { firstName: "Ada", email: "student@example.com", timezone: "America/Chicago" },
};

Deno.test("formatSessionTime renders the given instant in the target IANA timezone", () => {
  const result = formatSessionTime("2026-09-01T16:00:00.000Z", "America/Chicago");
  assertEquals(result.includes("2026"), true);
  assertEquals(result.includes("11:00"), true);
  assertEquals(result.includes("AM"), true);
});

Deno.test("formatSessionTime renders the same instant differently across timezones", () => {
  const chicago = formatSessionTime("2026-09-01T16:00:00.000Z", "America/Chicago");
  const losAngeles = formatSessionTime("2026-09-01T16:00:00.000Z", "America/Los_Angeles");
  assertEquals(chicago === losAngeles, false);
  assertEquals(losAngeles.includes("9:00"), true);
});

Deno.test("buildConfirmationEmails addresses each email to that recipient's own address", () => {
  const { student, tutor } = buildConfirmationEmails(sampleBooking);
  assertEquals(student.to, "student@example.com");
  assertEquals(tutor.to, "tutor@example.com");
});

Deno.test("buildConfirmationEmails: student body has the tutor's first name, never the tutor's email", () => {
  const { student } = buildConfirmationEmails(sampleBooking);
  assertEquals(student.text.includes("Dev"), true);
  assertEquals(student.text.includes("tutor@example.com"), false);
  assertEquals(student.html.includes("tutor@example.com"), false);
});

Deno.test("buildConfirmationEmails: tutor body has the student's first name, never the student's email", () => {
  const { tutor } = buildConfirmationEmails(sampleBooking);
  assertEquals(tutor.text.includes("Ada"), true);
  assertEquals(tutor.text.includes("student@example.com"), false);
  assertEquals(tutor.html.includes("student@example.com"), false);
});

Deno.test("buildConfirmationEmails: neither body ever contains the recipient's own email address either", () => {
  const { student, tutor } = buildConfirmationEmails(sampleBooking);
  assertEquals(student.text.includes("student@example.com"), false);
  assertEquals(tutor.text.includes("tutor@example.com"), false);
});

Deno.test("buildConfirmationEmails: each recipient sees the session time in their own timezone", () => {
  const { student, tutor } = buildConfirmationEmails(sampleBooking);
  assertEquals(student.text.includes("11:00"), true);
  assertEquals(tutor.text.includes("9:00"), true);
});

Deno.test("buildConfirmationEmails includes the meet link when present", () => {
  const { student, tutor } = buildConfirmationEmails(sampleBooking);
  assertEquals(student.text.includes(sampleBooking.meetLink!), true);
  assertEquals(tutor.text.includes(sampleBooking.meetLink!), true);
});

Deno.test("buildConfirmationEmails omits the meet link when null", () => {
  const { student, tutor } = buildConfirmationEmails({ ...sampleBooking, meetLink: null });
  assertEquals(student.text.includes("meet.google.com"), false);
  assertEquals(tutor.text.includes("meet.google.com"), false);
});

Deno.test("buildCancellationEmails never includes a meet link even if the booking still has one", () => {
  const { student, tutor } = buildCancellationEmails(sampleBooking);
  assertEquals(student.text.includes("meet.google.com"), false);
  assertEquals(tutor.text.includes("meet.google.com"), false);
});

Deno.test("buildCancellationEmails states the cancellation and includes the original session time", () => {
  const { student } = buildCancellationEmails(sampleBooking);
  assertEquals(student.text.toLowerCase().includes("cancel"), true);
  assertEquals(student.text.includes("11:00"), true);
});

Deno.test("html body escapes free-text topic content", () => {
  const { student } = buildConfirmationEmails(sampleBooking);
  assertEquals(student.html.includes("<exponents>"), false);
  assertEquals(student.html.includes("&lt;exponents&gt;"), true);
});

Deno.test("buildCancellationEmails: student body has the tutor's first name, never the tutor's email", () => {
  const { student } = buildCancellationEmails(sampleBooking);
  assertEquals(student.text.includes("Dev"), true);
  assertEquals(student.text.includes("tutor@example.com"), false);
  assertEquals(student.html.includes("tutor@example.com"), false);
});

Deno.test("buildCancellationEmails: tutor body has the student's first name, never the student's email", () => {
  const { tutor } = buildCancellationEmails(sampleBooking);
  assertEquals(tutor.text.includes("Ada"), true);
  assertEquals(tutor.text.includes("student@example.com"), false);
  assertEquals(tutor.html.includes("student@example.com"), false);
});

Deno.test("buildCancellationEmails: neither body ever contains the recipient's own email address either", () => {
  const { student, tutor } = buildCancellationEmails(sampleBooking);
  assertEquals(student.text.includes("student@example.com"), false);
  assertEquals(tutor.text.includes("tutor@example.com"), false);
});

Deno.test("buildConfirmationEmails: student never sees the tutor's formatted time, tutor never sees the student's", () => {
  const { student, tutor } = buildConfirmationEmails(sampleBooking);
  // tutor is America/Los_Angeles (9:00), student is America/Chicago (11:00)
  assertEquals(student.text.includes("9:00"), false);
  assertEquals(tutor.text.includes("11:00"), false);
});

Deno.test("buildCancellationEmails: student never sees the tutor's formatted time, tutor never sees the student's", () => {
  const { student, tutor } = buildCancellationEmails(sampleBooking);
  assertEquals(student.text.includes("9:00"), false);
  assertEquals(tutor.text.includes("11:00"), false);
});

const sampleRow: BookingRowForMapping = {
  id: "b0000000-0000-0000-0000-000000000003",
  start_time: "2026-09-02T17:00:00.000Z",
  meet_link: "https://meet.google.com/xyz-uvwx-rst",
  topic: "Quadratic equations",
  topic_category: "homework",
  subjects: { label: "Algebra II" },
  grade_levels: { label: "10th Grade" },
};

const sampleTutorProfile: ProfileForMapping = {
  first_name: "Priya",
  email: "priya-tutor@example.com",
  timezone: "America/New_York",
};

const sampleStudentProfile: ProfileForMapping = {
  first_name: "Sam",
  email: "sam-student@example.com",
  timezone: "America/Denver",
};

Deno.test("toBookingForNotification: builds the expected object for a confirm action", () => {
  const result = toBookingForNotification(
    "confirm",
    sampleRow,
    sampleTutorProfile,
    sampleStudentProfile,
  );

  assertEquals(result, {
    id: "b0000000-0000-0000-0000-000000000003",
    startTime: "2026-09-02T17:00:00.000Z",
    subjectLabel: "Algebra II",
    gradeLevelLabel: "10th Grade",
    topicCategory: "homework",
    topic: "Quadratic equations",
    meetLink: "https://meet.google.com/xyz-uvwx-rst",
    tutor: {
      firstName: "Priya",
      email: "priya-tutor@example.com",
      timezone: "America/New_York",
    },
    student: {
      firstName: "Sam",
      email: "sam-student@example.com",
      timezone: "America/Denver",
    },
  });
});

Deno.test("toBookingForNotification: action 'cancel' forces meetLink null even when the row has one", () => {
  const result = toBookingForNotification(
    "cancel",
    sampleRow,
    sampleTutorProfile,
    sampleStudentProfile,
  );

  assertEquals(result.meetLink, null);
  // the row itself still has a non-null meet_link — only the mapped output is forced null
  assertEquals(sampleRow.meet_link, "https://meet.google.com/xyz-uvwx-rst");
});

Deno.test("toBookingForNotification: tutor/student sub-objects carry no fields beyond firstName/email/timezone", () => {
  const result = toBookingForNotification(
    "confirm",
    sampleRow,
    sampleTutorProfile,
    sampleStudentProfile,
  );

  assertEquals(
    Object.keys(result.tutor).sort(),
    ["email", "firstName", "timezone"],
  );
  assertEquals(
    Object.keys(result.student).sort(),
    ["email", "firstName", "timezone"],
  );
});
