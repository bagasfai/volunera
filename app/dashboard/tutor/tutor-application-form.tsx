"use client";

import { useActionState, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  submitTutorApplication,
  type TutorApplicationState,
} from "@/lib/tutor/application-actions";
import type { LookupOption, TutorApplication } from "@/lib/tutor/dal";

const TEACHING_STYLE_OPTIONS = [
  "Visual explanations",
  "Practice problems",
  "Step-by-step learning",
  "Interactive lessons",
  "Homework support",
  "Test preparation",
  "Reading/writing exercises",
];

const initialState: TutorApplicationState = {};

function groupByCategory(options: LookupOption[]) {
  const groups = new Map<string, LookupOption[]>();
  for (const option of options) {
    const key = option.category ?? "Other";
    const existing = groups.get(key) ?? [];
    existing.push(option);
    groups.set(key, existing);
  }
  return groups;
}

export function TutorApplicationForm({
  application,
  lookups,
}: {
  application: TutorApplication | null;
  lookups: { gradeLevels: LookupOption[]; subjects: LookupOption[] };
}) {
  const [state, formAction, pending] = useActionState(
    submitTutorApplication,
    initialState,
  );
  const [photoUrl, setPhotoUrl] = useState(application?.profile.photo_url ?? "");
  const [photoError, setPhotoError] = useState<string | null>(null);

  const profile = application?.profile;
  const selectedGradeLevels = new Set(application?.gradeLevelIds ?? []);
  const selectedSubjects = new Set(application?.subjectIds ?? []);
  const selectedTeachingStyle = new Set(profile?.teaching_style_tags ?? []);

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPhotoError(
        "You appear to be signed out. Reload the page and try again.",
      );
      return;
    }

    const path = `${user.id}/${file.name}`;
    const { error } = await supabase.storage
      .from("tutor-photos")
      .upload(path, file, { upsert: true });

    if (error) {
      setPhotoError("Could not upload the photo. Try again.");
      return;
    }
    setPhotoUrl(path);
  }

  return (
    <form action={formAction} className="form">
      <input type="hidden" name="photoUrl" value={photoUrl} />

      <div className="form__row form__row--2">
        <div className="field">
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={profile?.phone ?? ""}
            required
            aria-invalid={state.fieldErrors?.phone ? true : undefined}
            aria-describedby={
              state.fieldErrors?.phone ? "phone-error" : undefined
            }
          />
          {state.fieldErrors?.phone && (
            <p id="phone-error" role="alert" className="field__error">
              {state.fieldErrors.phone}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="dateOfBirth">Date of birth</label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue={profile?.date_of_birth ?? ""}
            required
            aria-invalid={state.fieldErrors?.dateOfBirth ? true : undefined}
            aria-describedby={
              state.fieldErrors?.dateOfBirth ? "dateOfBirth-error" : undefined
            }
          />
          {state.fieldErrors?.dateOfBirth && (
            <p id="dateOfBirth-error" role="alert" className="field__error">
              {state.fieldErrors.dateOfBirth}
            </p>
          )}
        </div>
      </div>

      <div className="form__row form__row--2">
        <div className="field">
          <label htmlFor="educationStatus">School or college status</label>
          <input
            id="educationStatus"
            name="educationStatus"
            placeholder="e.g. 11th grade, or College sophomore"
            defaultValue={profile?.education_status ?? ""}
            required
            aria-invalid={state.fieldErrors?.educationStatus ? true : undefined}
            aria-describedby={
              state.fieldErrors?.educationStatus
                ? "educationStatus-error"
                : undefined
            }
          />
          {state.fieldErrors?.educationStatus && (
            <p id="educationStatus-error" role="alert" className="field__error">
              {state.fieldErrors.educationStatus}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="languages">Languages spoken</label>
          <input
            id="languages"
            name="languages"
            placeholder="English, Spanish"
            defaultValue={(profile?.languages ?? []).join(", ")}
            required
            aria-invalid={state.fieldErrors?.languages ? true : undefined}
            aria-describedby={
              state.fieldErrors?.languages ? "languages-error" : undefined
            }
          />
          {state.fieldErrors?.languages ? (
            <p id="languages-error" role="alert" className="field__error">
              {state.fieldErrors.languages}
            </p>
          ) : (
            <p className="field__hint">Separate each language with a comma.</p>
          )}
        </div>
      </div>

      <fieldset
        className="fieldset"
        aria-describedby={
          state.fieldErrors?.gradeLevelIds ? "gradeLevelIds-error" : undefined
        }
      >
        <legend className="fieldset__legend">
          Grade levels you can teach
        </legend>
        {Array.from(groupByCategory(lookups.gradeLevels)).map(
          ([category, options]) => (
            <div key={category} style={{ marginTop: "var(--space-sm)" }}>
              <p
                className="field__hint"
                style={{ textTransform: "capitalize", margin: 0 }}
              >
                {category}
              </p>
              <div className="choice-grid choice-grid--3">
                {options.map((option) => (
                  <label key={option.id} className="choice">
                    <input
                      type="checkbox"
                      name="gradeLevelIds"
                      value={option.id}
                      defaultChecked={selectedGradeLevels.has(option.id)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ),
        )}
        {state.fieldErrors?.gradeLevelIds && (
          <p id="gradeLevelIds-error" role="alert" className="field__error">
            {state.fieldErrors.gradeLevelIds}
          </p>
        )}
      </fieldset>

      <fieldset
        className="fieldset"
        aria-describedby={
          state.fieldErrors?.subjectIds ? "subjectIds-error" : undefined
        }
      >
        <legend className="fieldset__legend">Subjects you can teach</legend>
        <div className="choice-grid choice-grid--3">
          {lookups.subjects.map((option) => (
            <label key={option.id} className="choice">
              <input
                type="checkbox"
                name="subjectIds"
                value={option.id}
                defaultChecked={selectedSubjects.has(option.id)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.subjectIds && (
          <p id="subjectIds-error" role="alert" className="field__error">
            {state.fieldErrors.subjectIds}
          </p>
        )}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset__legend">Teaching style</legend>
        <div className="choice-grid choice-grid--3">
          {TEACHING_STYLE_OPTIONS.map((tag) => (
            <label key={tag} className="choice">
              <input
                type="checkbox"
                name="teachingStyleTags"
                value={tag}
                defaultChecked={selectedTeachingStyle.has(tag)}
              />
              <span>{tag}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="bio">About you</label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={profile?.bio ?? ""}
          required
          aria-invalid={state.fieldErrors?.bio ? true : undefined}
          aria-describedby={state.fieldErrors?.bio ? "bio-error" : "bio-hint"}
        />
        {state.fieldErrors?.bio ? (
          <p id="bio-error" role="alert" className="field__error">
            {state.fieldErrors.bio}
          </p>
        ) : (
          <p id="bio-hint" className="field__hint">
            Students read this on your public profile - say what you teach and
            why you enjoy it.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="motivation">Why do you want to volunteer?</label>
        <textarea
          id="motivation"
          name="motivation"
          defaultValue={profile?.motivation ?? ""}
          required
          aria-invalid={state.fieldErrors?.motivation ? true : undefined}
          aria-describedby={
            state.fieldErrors?.motivation ? "motivation-error" : "motivation-hint"
          }
        />
        {state.fieldErrors?.motivation ? (
          <p id="motivation-error" role="alert" className="field__error">
            {state.fieldErrors.motivation}
          </p>
        ) : (
          <p id="motivation-hint" className="field__hint">
            Only admins see this answer.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="priorExperience">
          Previous tutoring experience (optional)
        </label>
        <textarea
          id="priorExperience"
          name="priorExperience"
          maxLength={1200}
          defaultValue={profile?.prior_experience ?? ""}
          aria-invalid={state.fieldErrors?.priorExperience ? true : undefined}
          aria-describedby={
            state.fieldErrors?.priorExperience
              ? "priorExperience-error"
              : undefined
          }
        />
        {state.fieldErrors?.priorExperience && (
          <p id="priorExperience-error" role="alert" className="field__error">
            {state.fieldErrors.priorExperience}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="photo">Profile photo (optional)</label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          aria-invalid={state.fieldErrors?.photoUrl ? true : undefined}
          aria-describedby={
            state.fieldErrors?.photoUrl ? "photoUrl-error" : undefined
          }
        />
        {photoError && (
          <p role="alert" className="field__error">
            {photoError}
          </p>
        )}
        {state.fieldErrors?.photoUrl && (
          <p id="photoUrl-error" role="alert" className="field__error">
            {state.fieldErrors.photoUrl}
          </p>
        )}
        {photoUrl && <p className="field__hint">Photo uploaded.</p>}
      </div>

      {state.error && (
        <p role="alert" className="alert alert--error">
          {state.error}
        </p>
      )}

      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? "Submitting…" : "Submit application"}
        </button>
        <p className="field__hint" style={{ margin: 0 }}>
          An admin reviews every application before it goes live.
        </p>
      </div>
    </form>
  );
}
