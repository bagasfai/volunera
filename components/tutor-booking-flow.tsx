"use client";

import {
  useActionState,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

function labelFor(ids: string[] | null, labels: string[] | null, id: string) {
  const index = (ids ?? []).indexOf(id);
  return index === -1 ? "" : (labels ?? [])[index];
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
    return <p className="text-sm text-muted-foreground">Loading booking…</p>;
  }

  if (state.booking) {
    const booking = state.booking;
    return (
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <h3 className="text-lg font-medium">Booking confirmed</h3>
        <dl className="flex flex-col gap-1 text-sm">
          <div>
            <dt className="inline font-medium">Tutor: </dt>
            <dd className="inline">
              {tutor.first_name} {tutor.last_initial}.
            </dd>
          </div>
          <div>
            <dt className="inline font-medium">Subject: </dt>
            <dd className="inline">
              {labelFor(
                tutor.subject_ids,
                tutor.subject_labels,
                booking.subject_id,
              )}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium">Grade: </dt>
            <dd className="inline">
              {labelFor(
                tutor.grade_level_ids,
                tutor.grade_level_labels,
                booking.grade_level_id,
              )}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium">Time: </dt>
            <dd className="inline">
              {formatLocalDateTime(booking.start_time, timezone)}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium">Topic: </dt>
            <dd className="inline">{booking.topic}</dd>
          </div>
        </dl>
        <p className="text-sm text-muted-foreground">
          Your tutor will see this booking on their dashboard. Meeting details
          will follow separately.
        </p>
      </div>
    );
  }

  const errorBanner = (state.error || state.fieldErrors) && (
    <p className="text-sm text-destructive">
      {state.error ??
        "Something in your booking wasn't valid — please start over."}
    </p>
  );

  if (availableStarts.length === 0 && step === "slot") {
    return (
      <div className="flex flex-col gap-4">
        {errorBanner}
        <p className="text-sm text-muted-foreground">
          No upcoming availability
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {errorBanner}

      {step === "slot" && (
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-medium">Pick a time</h3>
          <div className="flex flex-wrap gap-2">
            {availableStarts.map((start) => (
              <Button
                key={start}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedStart(start);
                  setStep("questions");
                }}
              >
                {formatLocalDateTime(start, timezone)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {step === "questions" && selectedStart && (
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep("slot")}
          >
            Back
          </Button>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Subject</legend>
            <RadioGroup
              value={subjectId}
              onValueChange={(value) => setSubjectId(String(value))}
            >
              {(tutor.subject_ids ?? []).map((id, index) => (
                <Label key={id} className="flex items-center gap-2 font-normal">
                  <RadioGroupItem value={id} />
                  <span>{(tutor.subject_labels ?? [])[index]}</span>
                </Label>
              ))}
            </RadioGroup>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Student grade</legend>
            <RadioGroup
              value={gradeLevelId}
              onValueChange={(value) => setGradeLevelId(String(value))}
            >
              {(tutor.grade_level_ids ?? []).map((id, index) => (
                <Label key={id} className="flex items-center gap-2 font-normal">
                  <RadioGroupItem value={id} />
                  <span>{(tutor.grade_level_labels ?? [])[index]}</span>
                </Label>
              ))}
            </RadioGroup>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">
              What do you need help with?
            </legend>
            <RadioGroup
              value={topicCategory}
              onValueChange={(value) => setTopicCategory(String(value))}
            >
              {TOPIC_CATEGORIES.map((option) => (
                <Label
                  key={option.value}
                  className="flex items-center gap-2 font-normal"
                >
                  <RadioGroupItem value={option.value} />
                  <span>{option.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </fieldset>

          <div className="flex flex-col gap-1">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. Fractions"
              maxLength={200}
            />
          </div>

          <Button
            type="button"
            disabled={
              !subjectId ||
              !gradeLevelId ||
              !topicCategory ||
              topic.trim().length === 0
            }
            onClick={() => setStep("confirm")}
          >
            Continue
          </Button>
        </div>
      )}

      {step === "confirm" && selectedStart && (
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="tutorId" value={tutor.id} />
          <input type="hidden" name="startTime" value={selectedStart} />
          <input type="hidden" name="subjectId" value={subjectId} />
          <input type="hidden" name="gradeLevelId" value={gradeLevelId} />
          <input type="hidden" name="topicCategory" value={topicCategory} />
          <input type="hidden" name="topic" value={topic} />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep("questions")}
          >
            Back
          </Button>

          <dl className="flex flex-col gap-1 text-sm">
            <div>
              <dt className="inline font-medium">Tutor: </dt>
              <dd className="inline">
                {tutor.first_name} {tutor.last_initial}.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">Subject: </dt>
              <dd className="inline">
                {labelFor(tutor.subject_ids, tutor.subject_labels, subjectId)}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">Grade: </dt>
              <dd className="inline">
                {labelFor(
                  tutor.grade_level_ids,
                  tutor.grade_level_labels,
                  gradeLevelId,
                )}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">Time: </dt>
              <dd className="inline">
                {formatLocalDateTime(selectedStart, timezone)}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">Topic: </dt>
              <dd className="inline">{topic}</dd>
            </div>
          </dl>

          <Button type="submit" disabled={pending}>
            Confirm Booking
          </Button>
        </form>
      )}
    </div>
  );
}
