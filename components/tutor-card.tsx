import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { TutorAvailabilityPreview } from "@/components/tutor-availability-preview";
import type {
  PublicTutorProfile,
  PublicTutorSlot,
} from "@/lib/tutor/public-dal";

export function TutorCard({
  tutor,
  slots,
}: {
  tutor: PublicTutorProfile;
  slots: PublicTutorSlot[];
}) {
  const primarySubject = tutor.subject_labels?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {tutor.first_name} {tutor.last_initial}.
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {primarySubject
            ? `Volunteer ${primarySubject} Tutor`
            : "Volunteer Tutor"}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {tutor.grade_level_labels && tutor.grade_level_labels.length > 0 && (
          <p className="text-sm">
            <span className="font-medium">Teaches:</span>{" "}
            {tutor.grade_level_labels.join(", ")}
          </p>
        )}
        {tutor.subject_labels && tutor.subject_labels.length > 0 && (
          <p className="text-sm">
            <span className="font-medium">Subjects:</span>{" "}
            {tutor.subject_labels.join(", ")}
          </p>
        )}
        {tutor.languages && tutor.languages.length > 0 && (
          <p className="text-sm">
            <span className="font-medium">Languages:</span>{" "}
            {tutor.languages.join(", ")}
          </p>
        )}
        {tutor.bio && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {tutor.bio}
          </p>
        )}
        <div>
          <p className="text-sm font-medium">Upcoming availability</p>
          <TutorAvailabilityPreview slots={slots} variant="compact" />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Link
          href={`/tutors/${tutor.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          View Profile
        </Link>
        <Button size="sm" disabled title="Booking launches in a later phase">
          Book Session
        </Button>
      </CardFooter>
    </Card>
  );
}
