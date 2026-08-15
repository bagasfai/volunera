// app/dashboard/_shells/tutor-application-form.tsx
'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import {
  submitTutorApplication,
  type TutorApplicationState,
} from '@/lib/tutor/application-actions'
import type { LookupOption, TutorApplication } from '@/lib/tutor/dal'

const TEACHING_STYLE_OPTIONS = [
  'Visual explanations',
  'Practice problems',
  'Step-by-step learning',
  'Interactive lessons',
  'Homework support',
  'Test preparation',
  'Reading/writing exercises',
]

const initialState: TutorApplicationState = {}

function groupByCategory(options: LookupOption[]) {
  const groups = new Map<string, LookupOption[]>()
  for (const option of options) {
    const key = option.category ?? 'Other'
    const existing = groups.get(key) ?? []
    existing.push(option)
    groups.set(key, existing)
  }
  return groups
}

export function TutorApplicationForm({
  application,
  lookups,
}: {
  application: TutorApplication | null
  lookups: { gradeLevels: LookupOption[]; subjects: LookupOption[] }
}) {
  const [state, formAction, pending] = useActionState(
    submitTutorApplication,
    initialState,
  )
  const [photoUrl, setPhotoUrl] = useState(application?.profile.photo_url ?? '')
  const [photoError, setPhotoError] = useState<string | null>(null)

  const profile = application?.profile
  const selectedGradeLevels = new Set(application?.gradeLevelIds ?? [])
  const selectedSubjects = new Set(application?.subjectIds ?? [])
  const selectedTeachingStyle = new Set(profile?.teaching_style_tags ?? [])

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setPhotoError(null)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setPhotoError('You appear to be signed out. Reload the page and try again.')
      return
    }

    const path = `${user.id}/${file.name}`
    const { error } = await supabase.storage
      .from('tutor-photos')
      .upload(path, file, { upsert: true })

    if (error) {
      setPhotoError('Could not upload the photo. Try again.')
      return
    }
    setPhotoUrl(path)
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="photoUrl" value={photoUrl} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile?.phone ?? ''}
          required
          aria-invalid={state.fieldErrors?.phone ? true : undefined}
          aria-describedby={state.fieldErrors?.phone ? 'phone-error' : undefined}
        />
        {state.fieldErrors?.phone && (
          <p id="phone-error" role="alert" className="text-sm text-destructive">
            {state.fieldErrors.phone}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="dateOfBirth">Date of birth</Label>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          defaultValue={profile?.date_of_birth ?? ''}
          required
          aria-invalid={state.fieldErrors?.dateOfBirth ? true : undefined}
          aria-describedby={
            state.fieldErrors?.dateOfBirth ? 'dateOfBirth-error' : undefined
          }
        />
        {state.fieldErrors?.dateOfBirth && (
          <p id="dateOfBirth-error" role="alert" className="text-sm text-destructive">
            {state.fieldErrors.dateOfBirth}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="educationStatus">School or college status</Label>
        <Input
          id="educationStatus"
          name="educationStatus"
          placeholder="e.g. 11th grade, or College sophomore"
          defaultValue={profile?.education_status ?? ''}
          required
          aria-invalid={state.fieldErrors?.educationStatus ? true : undefined}
          aria-describedby={
            state.fieldErrors?.educationStatus ? 'educationStatus-error' : undefined
          }
        />
        {state.fieldErrors?.educationStatus && (
          <p
            id="educationStatus-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {state.fieldErrors.educationStatus}
          </p>
        )}
      </div>

      <fieldset
        className="flex flex-col gap-2"
        aria-describedby={
          state.fieldErrors?.gradeLevelIds ? 'gradeLevelIds-error' : undefined
        }
      >
        <legend className="text-sm font-medium">Grade levels you can teach</legend>
        {Array.from(groupByCategory(lookups.gradeLevels)).map(([category, options]) => (
          <div key={category} className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground capitalize">{category}</p>
            <div className="flex flex-wrap gap-3">
              {options.map((option) => (
                <Label
                  key={option.id}
                  className="flex items-center gap-2 font-normal"
                >
                  <Checkbox
                    name="gradeLevelIds"
                    value={option.id}
                    defaultChecked={selectedGradeLevels.has(option.id)}
                  />
                  <span>{option.label}</span>
                </Label>
              ))}
            </div>
          </div>
        ))}
        {state.fieldErrors?.gradeLevelIds && (
          <p id="gradeLevelIds-error" role="alert" className="text-sm text-destructive">
            {state.fieldErrors.gradeLevelIds}
          </p>
        )}
      </fieldset>

      <fieldset
        className="flex flex-col gap-2"
        aria-describedby={
          state.fieldErrors?.subjectIds ? 'subjectIds-error' : undefined
        }
      >
        <legend className="text-sm font-medium">Subjects you can teach</legend>
        <div className="flex flex-wrap gap-3">
          {lookups.subjects.map((option) => (
            <Label key={option.id} className="flex items-center gap-2 font-normal">
              <Checkbox
                name="subjectIds"
                value={option.id}
                defaultChecked={selectedSubjects.has(option.id)}
              />
              <span>{option.label}</span>
            </Label>
          ))}
        </div>
        {state.fieldErrors?.subjectIds && (
          <p id="subjectIds-error" role="alert" className="text-sm text-destructive">
            {state.fieldErrors.subjectIds}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">
          Tell students a little about yourself and why you enjoy tutoring
        </Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={profile?.bio ?? ''}
          required
          aria-invalid={state.fieldErrors?.bio ? true : undefined}
          aria-describedby={state.fieldErrors?.bio ? 'bio-error' : undefined}
        />
        {state.fieldErrors?.bio && (
          <p id="bio-error" role="alert" className="text-sm text-destructive">
            {state.fieldErrors.bio}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="motivation">Why do you want to volunteer?</Label>
        <Textarea
          id="motivation"
          name="motivation"
          defaultValue={profile?.motivation ?? ''}
          required
          aria-invalid={state.fieldErrors?.motivation ? true : undefined}
          aria-describedby={
            state.fieldErrors?.motivation ? 'motivation-error' : undefined
          }
        />
        {state.fieldErrors?.motivation && (
          <p id="motivation-error" role="alert" className="text-sm text-destructive">
            {state.fieldErrors.motivation}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="priorExperience">
          Previous tutoring experience (optional)
        </Label>
        <Textarea
          id="priorExperience"
          name="priorExperience"
          maxLength={1200}
          defaultValue={profile?.prior_experience ?? ''}
          aria-invalid={state.fieldErrors?.priorExperience ? true : undefined}
          aria-describedby={
            state.fieldErrors?.priorExperience ? 'priorExperience-error' : undefined
          }
        />
        {state.fieldErrors?.priorExperience && (
          <p
            id="priorExperience-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {state.fieldErrors.priorExperience}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="languages">Languages spoken</Label>
        <Input
          id="languages"
          name="languages"
          placeholder="English, Spanish"
          defaultValue={(profile?.languages ?? []).join(', ')}
          required
          aria-invalid={state.fieldErrors?.languages ? true : undefined}
          aria-describedby={
            state.fieldErrors?.languages ? 'languages-error' : undefined
          }
        />
        {state.fieldErrors?.languages && (
          <p id="languages-error" role="alert" className="text-sm text-destructive">
            {state.fieldErrors.languages}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Teaching style</legend>
        <div className="flex flex-wrap gap-3">
          {TEACHING_STYLE_OPTIONS.map((tag) => (
            <Label key={tag} className="flex items-center gap-2 font-normal">
              <Checkbox
                name="teachingStyleTags"
                value={tag}
                defaultChecked={selectedTeachingStyle.has(tag)}
              />
              <span>{tag}</span>
            </Label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="photo">Profile photo (optional)</Label>
        <Input
          id="photo"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          aria-invalid={state.fieldErrors?.photoUrl ? true : undefined}
          aria-describedby={
            state.fieldErrors?.photoUrl ? 'photoUrl-error' : undefined
          }
        />
        {photoError && (
          <p role="alert" className="text-sm text-destructive">
            {photoError}
          </p>
        )}
        {state.fieldErrors?.photoUrl && (
          <p id="photoUrl-error" role="alert" className="text-sm text-destructive">
            {state.fieldErrors.photoUrl}
          </p>
        )}
        {photoUrl && (
          <p className="text-sm text-muted-foreground">Photo uploaded.</p>
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  )
}
