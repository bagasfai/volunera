import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Calculator,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  Clock3,
  Pencil,
  Search,
  ShieldCheck,
  Star,
  Users,
  Video,
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SectionHead } from "@/components/section-head";
import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  getPublicTutorLookups,
  searchPublicTutors,
} from "@/lib/tutor/public-dal";

const LEARNER_STEPS = [
  {
    icon: Search,
    title: "Find",
    body: "Choose your grade level and the subject you need help with.",
  },
  {
    icon: Users,
    title: "Choose",
    body: "Browse approved volunteer tutors and read their profiles.",
  },
  {
    icon: CalendarPlus,
    title: "Book",
    body: "Pick an available date and time that matches your routine.",
  },
  {
    icon: Video,
    title: "Learn",
    body: "Meet your tutor on Google Meet for a friendly 1-on-1 session.",
  },
];

const TUTOR_STEPS = [
  {
    icon: ClipboardList,
    title: "Sign Up",
    body: "Create your volunteer profile and select the subjects you know.",
  },
  {
    icon: Clock3,
    title: "Set Availability",
    body: "Choose the weekly hours you are free to tutor in your own timezone.",
  },
  {
    icon: BookOpen,
    title: "Teach",
    body: "Meet students over Google Meet. Your hours are tracked for you.",
  },
];

const CATEGORY_META: Record<
  string,
  { label: string; icon: typeof Pencil; order: number }
> = {
  elementary: { label: "Elementary", icon: Pencil, order: 0 },
  middle: { label: "Middle School", icon: BookOpen, order: 1 },
  high: { label: "High School", icon: Calculator, order: 2 },
};

const PLACEHOLDER_TESTIMONIALS = [
  {
    quote:
      "Learnivia has been a life-saver for my eighth grader. He was struggling with algebra, but after a few free 1-on-1 sessions his understanding and confidence soared.",
    who: "David R.",
    where: "Parent of an 8th grader",
  },
  {
    quote:
      "The volunteer tutors are incredibly patient and warm. Finding help for AP Chemistry was simple, and the Google Meet integration is convenient for busy school nights.",
    who: "Samantha K.",
    where: "High school junior",
  },
  {
    quote:
      "As a parent, I love that it is completely free and easy to navigate. Booking takes seconds, and choosing a consistent tutor makes it feel like private tutoring.",
    who: "Elena M.",
    where: "Parent of an elementary student",
  },
];

export default async function HomePage() {
  const [lookups, featured, profile] = await Promise.all([
    getPublicTutorLookups(),
    searchPublicTutors({ page: 1 }),
    getProfile(),
  ]);

  const featuredTutors = featured.tutors.slice(0, 3);

  const supabase = await createClient();
  const photos = await Promise.all(
    featuredTutors.map(async (tutor) => {
      if (!tutor.photo_url) return null;
      const { data } = await supabase.storage
        .from("tutor-photos")
        .createSignedUrl(tutor.photo_url, 3600);
      return data?.signedUrl ?? null;
    }),
  );

  const gradesByCategory = new Map<string, string[]>();
  for (const grade of lookups.gradeLevels) {
    const existing = gradesByCategory.get(grade.category) ?? [];
    existing.push(grade.label);
    gradesByCategory.set(grade.category, existing);
  }
  const categories = Array.from(gradesByCategory.entries()).sort(
    ([a], [b]) =>
      (CATEGORY_META[a]?.order ?? 9) - (CATEGORY_META[b]?.order ?? 9),
  );

  const stats = [
    { num: String(featured.total), label: "Approved volunteer tutors" },
    { num: String(lookups.subjects.length), label: "Subjects covered" },
    { num: String(lookups.gradeLevels.length), label: "Grade levels served" },
    { num: "100%", label: "Always free" },
  ];

  return (
    <>
      <SiteNav isSignedIn={Boolean(profile)} />

      <main>
        {/* ---- Hero ---- */}
        <section className="band">
          <div className="wrap hero">
            <div className="hero__grid">
              <div
                className="hero__copy reveal"
                style={{ "--i": 0 } as React.CSSProperties}
              >
                <p className="badge-pill">100% free 1-on-1 tutoring</p>
                <h1 className="hero__title">
                  Free Online Tutoring.
                  <em>Personalized Support.</em>
                </h1>
                <p className="hero__lede">
                  Find a volunteer tutor, choose a time that works for you, and
                  meet one-on-one through Google Meet for completely free.
                </p>
                <div className="hero__actions">
                  <Link href="/tutors" className="btn btn--primary btn--lg">
                    Find a Tutor
                  </Link>
                  <Link href="/signup" className="btn btn--outline btn--lg">
                    Become a Volunteer Tutor
                  </Link>
                </div>
                <ul className="hero__proof">
                  <li>
                    <ShieldCheck aria-hidden="true" /> Reviewed tutors
                  </li>
                  <li>
                    <CalendarDays aria-hidden="true" /> Flexible scheduling
                  </li>
                  <li>
                    <Video aria-hidden="true" /> Google Meet lessons
                  </li>
                </ul>
              </div>

              <figure
                className="hero__figure reveal"
                style={{ "--i": 1 } as React.CSSProperties}
              >
                <Image
                  src="/mascot/livi-learnivia.png"
                  alt="Livi the fox, Learnivia's mascot, reading a book"
                  width={720}
                  height={900}
                  priority
                  className="hero__figure-img"
                />
              </figure>
            </div>
          </div>
        </section>

        {/* ---- How it works · learners ---- */}
        <section id="how-it-works" className="band band--white section">
          <div className="wrap">
            <SectionHead
              eyebrow="For students & parents"
              title="How It Works for Learners"
              lede="Booking a free one-on-one session is simple, fast, and safe."
            />
            <ol
              className="grid-auto grid-auto--4"
              style={{ listStyle: "none" }}
            >
              {LEARNER_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="card card--lift step-card">
                    <div className="step-card__top">
                      <span className="icon-chip" aria-hidden="true">
                        <Icon />
                      </span>
                      <span className="step-card__num" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* ---- How it works · tutors ---- */}
        <section id="for-tutors" className="band section">
          <div className="wrap">
            <SectionHead
              eyebrow="For volunteers"
              title="How It Works for Tutors"
              lede="Share what you know, track your volunteer hours, and change a student's year."
            />
            <ol
              className="grid-auto grid-auto--3"
              style={{ listStyle: "none" }}
            >
              {TUTOR_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="card card--lift step-card">
                    <div className="step-card__top">
                      <span className="icon-chip" aria-hidden="true">
                        <Icon />
                      </span>
                      <span className="step-card__num" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* ---- Featured tutors (real approved tutors only) ---- */}
        <section id="tutors" className="band band--white section">
          <div className="wrap">
            <SectionHead
              eyebrow="Meet our community"
              title="Featured Volunteer Tutors"
              lede="Every tutor is reviewed by an administrator before students can find them."
            />

            {featuredTutors.length === 0 ? (
              <div className="empty">
                <h2>No tutors approved yet</h2>
                <p>
                  The first volunteers are being reviewed. Want to be one of
                  them?
                </p>
                <p style={{ marginTop: "var(--space-md)" }}>
                  <Link href="/signup" className="btn btn--primary">
                    Become a Volunteer Tutor
                  </Link>
                </p>
              </div>
            ) : (
              <ul
                className="grid-auto grid-auto--3"
                style={{ listStyle: "none" }}
              >
                {featuredTutors.map((tutor, i) => (
                  <li key={tutor.id} className="card card--lift tutor-card">
                    <div className="tutor-card__media">
                      {photos[i] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photos[i]!}
                          alt={`${tutor.first_name} ${tutor.last_initial}.`}
                          width={480}
                          height={300}
                        />
                      ) : (
                        <Image
                          src={tutor.photo_url ?? "/mascot/livi-learnivia.png"}
                          alt=""
                          width={360}
                          height={450}
                          style={{ width: "auto", height: "80%" }}
                        />
                      )}
                    </div>
                    <div className="tutor-card__body">
                      <div className="tutor-card__name-row">
                        <div>
                          <h3>
                            {tutor.first_name} {tutor.last_initial}.
                          </h3>
                          <p className="tutor-card__role">Volunteer Tutor</p>
                        </div>
                        <span className="tutor-card__verified">
                          <BadgeCheck aria-hidden="true" /> Verified
                        </span>
                      </div>

                      {tutor.subject_labels &&
                        tutor.subject_labels.length > 0 && (
                          <ul className="tutor-card__tags">
                            {tutor.subject_labels.slice(0, 3).map((label) => (
                              <li key={label} className="tag">
                                {label}
                              </li>
                            ))}
                            {tutor.grade_level_labels?.[0] && (
                              <li className="tag tag--outline">
                                {tutor.grade_level_labels[0]}
                              </li>
                            )}
                          </ul>
                        )}

                      {tutor.bio && (
                        <p className="tutor-card__bio">{tutor.bio}</p>
                      )}
                    </div>
                    <div className="tutor-card__foot">
                      <Link
                        href={`/tutors/${tutor.id}`}
                        className="tutor-card__link"
                      >
                        View Profile <ArrowRight aria-hidden="true" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <p style={{ textAlign: "center", marginTop: "var(--space-xl)" }}>
              <Link href="/tutors" className="btn btn--primary">
                Search All Tutors
              </Link>
            </p>
          </div>
        </section>

        {/* ---- Coverage ---- */}
        <section id="subjects" className="band section">
          <div className="wrap">
            <SectionHead
              eyebrow="Expertise"
              title="What We Cover"
              lede="Grade levels and subjects are curated by Learnivia admins, so the list stays real."
            />

            <div className="grid-auto grid-auto--3">
              {categories.map(([category, grades]) => {
                const meta = CATEGORY_META[category];
                const Icon = meta?.icon ?? BookOpen;
                return (
                  <div key={category} className="card subject-card">
                    <div className="subject-card__head">
                      <span className="icon-chip" aria-hidden="true">
                        <Icon />
                      </span>
                      <h3>{meta?.label ?? category}</h3>
                    </div>
                    <ul>
                      {grades.map((label) => (
                        <li key={label} className="tag tag--cream">
                          {label}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {lookups.subjects.length > 0 && (
              <div
                className="card subject-card"
                style={{ marginTop: "var(--space-lg)" }}
              >
                <div className="subject-card__head">
                  <span className="icon-chip" aria-hidden="true">
                    <BookOpen />
                  </span>
                  <h3>Subjects</h3>
                </div>
                <ul>
                  {lookups.subjects.map((subject) => (
                    <li key={subject.id} className="tag tag--cream">
                      {subject.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* ---- Impact ---- */}
        <section id="impact" className="band band--sky section">
          <div className="wrap">
            <SectionHead
              eyebrow="Our impact"
              title="Our Growing Impact in the Community"
              lede="Connecting students who need support with volunteers who want to help."
            />
            <dl className="stats">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="stat__num">{stat.num}</dd>
                  <dt className="stat__label">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ---- Stories ---- */}
        <section id="stories" className="band section">
          <div className="wrap">
            <SectionHead
              eyebrow="Success stories"
              title="What Parents & Students Say"
              lede="Feedback from families who reached their goals with a Learnivia tutor."
            />
            <div className="grid-auto grid-auto--3">
              {PLACEHOLDER_TESTIMONIALS.map((item) => (
                <figure key={item.who} className="card quote-card">
                  <div className="quote-card__top">
                    <span
                      className="avatar avatar--initials"
                      aria-hidden="true"
                    >
                      {item.who[0]}
                    </span>
                    <span className="quote-card__stars" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} />
                      ))}
                    </span>
                  </div>
                  <blockquote>{item.quote}</blockquote>
                  <figcaption>
                    <span className="quote-card__who">{item.who}</span>
                    <span className="quote-card__where">{item.where}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Volunteer CTA ---- */}
        <section className="band band--white section">
          <div className="wrap">
            <div className="cta-panel">
              <div>
                <p className="badge-pill">Join as a volunteer</p>
                <h2>Make a Difference with One Session at a Time</h2>
                <p>
                  Help young minds succeed by volunteering your tutoring skills.
                  Whether you teach math, reading, or physics, your mentorship
                  matters to students and every hour you give is tracked for you.
                </p>
                <ul className="cta-panel__points">
                  <li>
                    <Clock3 aria-hidden="true" /> Volunteer hour tracking
                  </li>
                  <li>
                    <Award aria-hidden="true" /> Approved before you appear
                  </li>
                </ul>
                <Link href="/signup" className="btn btn--on-navy btn--lg">
                  Apply to Tutor
                </Link>
              </div>
              <figure className="cta-panel__figure">
                <Image
                  src="/mascot/livi-join-google-meet.png"
                  alt="Livi the fox holding a volunteer tutor badge"
                  width={720}
                  height={900}
                  loading="lazy"
                  className="rounded-md"
                />
              </figure>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
