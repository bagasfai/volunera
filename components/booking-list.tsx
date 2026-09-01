import { formatSessionRange } from "@/lib/format/datetime";
import { CancelBookingButton } from "./cancel-booking-button";

export type BookingListRow = {
  id: string;
  startTime: string;
  endTime: string;
  counterpartLabel: string;
  counterpartSublabel?: string;
  subject: string;
  grade: string;
  topicCategory: string;
  topic: string;
  status: string;
  meetLink: string | null;
  cancelable: boolean;
};

const TOPIC_CATEGORY_LABELS: Record<string, string> = {
  homework: "Homework",
  classwork: "Classwork",
  general_improvement: "General improvement",
  upcoming_test: "Upcoming test",
  organization_curriculum: "Organization curriculum",
  other: "Other",
};

const STATUS_PILL: Record<string, string> = {
  confirmed: "status-pill--ok",
  completed: "status-pill--ok",
  canceled: "status-pill--stop",
  no_show: "status-pill--stop",
};

export function BookingList({
  rows,
  timezone,
  revalidatePath,
  emptyMessage,
}: {
  rows: BookingListRow[];
  timezone: string;
  revalidatePath: string;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <p className="field__hint">{emptyMessage}</p>;
  }

  return (
    <ul className="booking-rows">
      {rows.map((row) => {
        const isUpcoming = new Date(row.endTime).getTime() > new Date().getTime();

        return (
          <li key={row.id} className="booking-row">
            <div className="booking-row__when">
              {formatSessionRange(row.startTime, row.endTime, timezone)}
            </div>

            <div className="booking-row__who">
              <p className="booking-row__name">{row.counterpartLabel}</p>
              {row.counterpartSublabel && (
                <p className="booking-row__meta">{row.counterpartSublabel}</p>
              )}
            </div>

            <div className="booking-row__what">
              <p className="booking-row__meta">
                {row.subject} · {row.grade}
              </p>
              <p className="booking-row__topic">
                {TOPIC_CATEGORY_LABELS[row.topicCategory] ?? row.topicCategory}:{" "}
                {row.topic}
              </p>
            </div>

            <div className="booking-row__actions">
              <span
                className={`status-pill ${STATUS_PILL[row.status] ?? "status-pill--wait"}`}
              >
                {row.status.replace("_", " ")}
              </span>
              {row.meetLink && row.status === "confirmed" && isUpcoming && (
                <a
                  href={row.meetLink}
                  className="btn btn--primary btn--sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  Join on Meet
                </a>
              )}
              {row.cancelable && (
                <CancelBookingButton
                  bookingId={row.id}
                  revalidatePath={revalidatePath}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
