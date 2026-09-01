"use client";

import {
  useActionState,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { ArrowLeft, CalendarCheck, ExternalLink } from "lucide-react";
import {
  createBooking,
  type BookingActionState,
} from "@/lib/tutor/booking-actions";
import { SLOT_TAKEN_MESSAGE } from "@/lib/tutor/booking-messages";
import { sliceIntoBookableStarts } from "@/lib/tutor/slot-slicing";

const SESSION_DURATION_MINUTES = 45;

const TOPIC_CATEGORIES: { value: string; label: string }[] = [
  { value: "homework", label: "Homework" },
  { value: "classwork", label: "Classwork" },
  { value: "general_improvement", label: "General subject improvement" },
  { value: "upcoming_test", label: "Upcoming test" },
  { value: "organization_curriculum", label: "Organization curriculum" },
  { value: "other", label: "Other" },
];

const STEPS = [
  { key: "slot", label: "Time" },
  { key: "questions", label: "Details" },
  { key: "confirm", label: "Confirm" },
] as const;

export type TutorForBooking = {
  id: string;
  first_name: string | null;
  last_initial: string | null;
  subject_ids: string[] | null;
  subject_labels: string[] | null;
  grade_level_ids: string[] | null;
  grade_level_labels: string[] | null;
};

type Slot = { slotStart: string; slotEnd: string };

const initialState: BookingActionState = {};

function subscribeToNothing() {
  return () => {};
}

function getClientTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getServerTimezone() {
  return null;
}

function formatLocalDateTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDayLabel(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function formatTimeLabel(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function labelFor(ids: string[] | null, labels: string[] | null, id: string) {
  const index = (ids ?? []).indexOf(id);
  return index === -1 ? "" : (labels ?? [])[index];
}

function groupStartsByDay(starts: string[], timezone: string) {
  const groups = new Map<string, string[]>();
  for (const start of starts) {
    const label = formatDayLabel(start, timezone);
    const existing = groups.get(label) ?? [];
    existing.push(start);
    groups.set(label, existing);
  }
  return groups;
}

export function TutorBookingFlow({
  tutor,
  slots,
}: {
  tutor: TutorForBooking;
  slots: Slot[];
}) {
  const [step, setStep] = useState<"slot" | "questions" | "confirm">("slot");
  const [availableStarts, setAvailableStarts] = useState(() =>
    sliceIntoBookableStarts(slots, SESSION_DURATION_MINUTES),
  );
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [gradeLevelId, setGradeLevelId] = useState("");
  const [topicCategory, setTopicCategory] = useState("");
  const [topic, setTopic] = useState("");
  const timezone = useSyncExternalStore(
    subscribeToNothing,
    getClientTimezone,
    getServerTimezone,
  );
  const [state, formAction, pending] = useActionState(
    createBooking,
    initialState,
  );

  useEffect(() => {
    if (state.error === SLOT_TAKEN_MESSAGE && selectedStart) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailableStarts((prev) =>
        prev.filter((start) => start !== selectedStart),
      );
      setSelectedStart(null);
      setStep("slot");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (!timezone) {
    return <p className="field__hint">Loading booking…</p>;
  }

  if (state.booking) {
    const booking = state.booking;
    return (
      <div className="stack">
        <div className="alert alert--ok">
          <strong
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <CalendarCheck size={18} aria-hidden="true" /> Booking confirmed
          </strong>
        </div>
        <dl className="summary-list">
          <div>
            <dt>Tutor</dt>
            <dd>
              {tutor.first_name} {tutor.last_initial}.
            </dd>
          </div>
          <div>
            <dt>Subject</dt>
            <dd>
              {labelFor(
                tutor.subject_ids,
                tutor.subject_labels,
                booking.subject_id,
              )}
            </dd>
          </div>
          <div>
            <dt>Grade</dt>
            <dd>
              {labelFor(
                tutor.grade_level_ids,
                tutor.grade_level_labels,
                booking.grade_level_id,
              )}
            </dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{formatLocalDateTime(booking.start_time, timezone)}</dd>
          </div>
          <div>
            <dt>Topic</dt>
            <dd>{booking.topic}</dd>
          </div>
        </dl>
        {booking.meet_link ? (
          <p style={{ margin: 0 }}>
            <a
              href={booking.meet_link}
              className="link"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              Open your Google Meet link{" "}
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          </p>
        ) : (
          <p className="field__hint">
            Your tutor sees this booking on their dashboard. Meeting details
            follow by email.
          </p>
        )}
      </div>
    );
  }

  const errorBanner = (state.error || state.fieldErrors) && (
    <p role="alert" className="alert alert--error">
      {state.error ??
        "Something in your booking wasn't valid, please start over."}
    </p>
  );

  if (availableStarts.length === 0 && step === "slot") {
    return (
      <div className="stack">
        {errorBanner}
        <p className="field__hint">
          No upcoming availability. Check back soon, or browse another tutor.
        </p>
      </div>
    );
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const dayGroups = groupStartsByDay(availableStarts, timezone);

  return (
    <div className="stack" style={{ gap: "var(--space-lg)" }}>
      <ol
        className="tutor-card__tags"
        aria-label="Booking steps"
        style={{ gap: "var(--space-xs)" }}
      >
        {STEPS.map((s, i) => (
          <li
            key={s.key}
            className={`status-pill${i === stepIndex ? " status-pill--ok" : ""}`}
            aria-current={i === stepIndex ? "step" : undefined}
          >
            {i + 1}. {s.label}
          </li>
        ))}
      </ol>

      {errorBanner}

      {step === "slot" && (
        <div className="stack">
          <h3 style={{ fontSize: "var(--text-md)" }}>Pick a time</h3>
          {Array.from(dayGroups.entries()).map(([day, starts]) => (
            <div key={day} className="day-group">
              <span className="day-group__label">{day}</span>
              <ul className="booking__slots">
                {starts.map((start) => (
                  <li key={start}>
                    <button
                      type="button"
                      className="slot-btn"
                      aria-pressed={selectedStart === start}
                      onClick={() => {
                        setSelectedStart(start);
                        setStep("questions");
                      }}
                    >
                      {formatTimeLabel(start, timezone)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {step === "questions" && selectedStart && (
        <div className="stack" style={{ gap: "var(--space-lg)" }}>
          <button
            type="button"
            className="btn btn--text btn--sm"
            style={{ alignSelf: "flex-start", paddingInline: 0 }}
            onClick={() => setStep("slot")}
          >
            <ArrowLeft size={16} aria-hidden="true" /> Change time
          </button>

          <p className="field__hint" style={{ margin: 0 }}>
            {formatLocalDateTime(selectedStart, timezone)}
          </p>

          <fieldset className="fieldset">
            <legend className="fieldset__legend">Subject</legend>
            <div className="choice-grid choice-grid--2">
              {(tutor.subject_ids ?? []).map((id, index) => (
                <label key={id} className="choice">
                  <input
                    type="radio"
                    name="booking-subject"
                    value={id}
                    checked={subjectId === id}
                    onChange={() => setSubjectId(id)}
                  />
                  <span>{(tutor.subject_labels ?? [])[index]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset__legend">Student grade</legend>
            <div className="choice-grid choice-grid--2">
              {(tutor.grade_level_ids ?? []).map((id, index) => (
                <label key={id} className="choice">
                  <input
                    type="radio"
                    name="booking-grade"
                    value={id}
                    checked={gradeLevelId === id}
                    onChange={() => setGradeLevelId(id)}
                  />
                  <span>{(tutor.grade_level_labels ?? [])[index]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset__legend">
              What do you need help with?
            </legend>
            <div className="choice-grid choice-grid--2">
              {TOPIC_CATEGORIES.map((option) => (
                <label key={option.value} className="choice">
                  <input
                    type="radio"
                    name="booking-topic-category"
                    value={option.value}
                    checked={topicCategory === option.value}
                    onChange={() => setTopicCategory(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="topic">Topic</label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. Fractions"
              maxLength={200}
            />
            <p className="field__hint">
              One line is enough, it helps your tutor prepare.
            </p>
          </div>

          <button
            type="button"
            className="btn btn--primary"
            disabled={
              !subjectId ||
              !gradeLevelId ||
              !topicCategory ||
              topic.trim().length === 0
            }
            onClick={() => setStep("confirm")}
          >
            Continue
          </button>
        </div>
      )}

      {step === "confirm" && selectedStart && (
        <form action={formAction} className="stack">
          <input type="hidden" name="tutorId" value={tutor.id} />
          <input type="hidden" name="startTime" value={selectedStart} />
          <input type="hidden" name="subjectId" value={subjectId} />
          <input type="hidden" name="gradeLevelId" value={gradeLevelId} />
          <input type="hidden" name="topicCategory" value={topicCategory} />
          <input type="hidden" name="topic" value={topic} />

          <button
            type="button"
            className="btn btn--text btn--sm"
            style={{ alignSelf: "flex-start", paddingInline: 0 }}
            onClick={() => setStep("questions")}
          >
            <ArrowLeft size={16} aria-hidden="true" /> Edit details
          </button>

          <dl className="summary-list">
            <div>
              <dt>Tutor</dt>
              <dd>
                {tutor.first_name} {tutor.last_initial}.
              </dd>
            </div>
            <div>
              <dt>Subject</dt>
              <dd>
                {labelFor(tutor.subject_ids, tutor.subject_labels, subjectId)}
              </dd>
            </div>
            <div>
              <dt>Grade</dt>
              <dd>
                {labelFor(
                  tutor.grade_level_ids,
                  tutor.grade_level_labels,
                  gradeLevelId,
                )}
              </dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{formatLocalDateTime(selectedStart, timezone)}</dd>
            </div>
            <div>
              <dt>Topic</dt>
              <dd>{topic}</dd>
            </div>
          </dl>

          <button type="submit" className="btn btn--primary" disabled={pending}>
            {pending ? "Booking…" : "Confirm booking"}
          </button>
        </form>
      )}
    </div>
  );
}
