import Link from "next/link"
import Image from "next/image"
import { Baloo_2, Plus_Jakarta_Sans } from "next/font/google"
import { ShieldCheck, HandHeart, Globe2 } from "lucide-react"
import { SiteNav } from "@/components/site-nav"

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
})

const STEPS = [
  { num: "01", title: "Find", body: "Choose your grade and subject." },
  { num: "02", title: "Choose", body: "Browse tutors and read their profiles." },
  { num: "03", title: "Book", body: "Choose an available date and time." },
  { num: "04", title: "Learn", body: "Meet your tutor online through Google Meet." },
]

const STUDENT_POINTS = [
  "Filter tutors by grade level and subject",
  "See real-time availability in your own timezone",
  "Book a free session in a few clicks",
  "Get your Google Meet link by email — no extra sign-up",
]

const VOLUNTEER_POINTS = [
  "Apply and pick the grades and subjects you teach",
  "Set your own weekly availability",
  "Get approved before you appear publicly",
  "Track your volunteer hours automatically",
]

export default function HomePage() {
  return (
    <div className={`landing-theme ${baloo.variable} ${jakarta.variable}`}>
      <SiteNav />

      <main>
        <section className="hero">
          <div className="hero__grid">
            <div className="hero__copy" style={{ "--i": 0 } as React.CSSProperties}>
              <h1 className="hero__title">Free Online Tutoring. Personalized Support.</h1>
              <p className="hero__lede">
                Find a volunteer tutor, choose a time that works for you, and meet one-on-one
                through Google Meet — completely free.
              </p>
              <div className="hero__actions">
                <Link href="/signup" className="btn btn--primary btn--lg">
                  Find a Tutor
                </Link>
                <Link href="/signup" className="btn btn--outline btn--lg">
                  Become a Volunteer Tutor
                </Link>
              </div>
            </div>
            <div className="hero__figure" style={{ "--i": 1 } as React.CSSProperties}>
              <div className="hero__figure-backdrop" aria-hidden="true" />
              <Image
                src="/mascot/livi-find-a-tutor.png"
                alt="Livi the fox, Learnivia's mascot, wearing a backpack and holding a book"
                width={720}
                height={900}
                priority
                className="hero__figure-img"
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="steps-section">
          <header className="head-hang">
            <h2>How it works</h2>
          </header>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li className="step" key={step.num} style={{ "--i": i } as React.CSSProperties}>
                <span className="step__num">{step.num}</span>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__body">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="students" className="split__row">
          <div className="split__text">
            <h2>For students &amp; parents</h2>
            <p>
              Search approved volunteer tutors, compare profiles, and book a session that fits
              your schedule — every session is free.
            </p>
            <ul className="split__points">
              {STUDENT_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <Link href="/signup" className="btn btn--outline">
              Find a Tutor
            </Link>
          </div>
          <figure className="split__figure">
            <Image
              src="/mascot/livi-book-a-session.png"
              alt="Livi the fox pointing at a calendar with a booked session checked off"
              width={720}
              height={900}
              loading="lazy"
              className="split__figure-img"
            />
          </figure>
        </section>

        <section id="volunteers" className="split__row split__row--reverse">
          <figure className="split__figure">
            <Image
              src="/mascot/livi-become-a-tutor.png"
              alt="Livi the fox holding up a volunteer tutor identification badge"
              width={720}
              height={900}
              loading="lazy"
              className="split__figure-img"
            />
          </figure>
          <div className="split__text">
            <h2>For volunteer tutors</h2>
            <p>
              Teach the grades and subjects you know, on the hours you set. We handle scheduling,
              timezones, and the Google Meet link.
            </p>
            <ul className="split__points">
              {VOLUNTEER_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <Link href="/signup" className="btn btn--outline">
              Become a Tutor
            </Link>
          </div>
        </section>

        <section className="trust">
          <div className="trust__item trust__item--wide">
            <ShieldCheck aria-hidden="true" />
            <div>
              <h3>Tutors are reviewed before they appear</h3>
              <p>Every volunteer is approved by an administrator before students can find them.</p>
            </div>
          </div>
          <div className="trust__item">
            <HandHeart aria-hidden="true" />
            <div>
              <h3>Always free</h3>
              <p>No fees, ever — for students or tutors.</p>
            </div>
          </div>
          <div className="trust__item">
            <Globe2 aria-hidden="true" />
            <div>
              <h3>Your timezone, automatically</h3>
              <p>Availability shows in your local time — no math required.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot-stmt">
        <p className="foot-stmt__line">Every student deserves someone who shows up.</p>
        <div className="foot-stmt__links">
          <a href="#how-it-works">How it works</a>
          <Link href="/signup">Find a Tutor</Link>
          <Link href="/signup">Become a Tutor</Link>
          <Link href="/login">Log in</Link>
        </div>
        <div className="foot-stmt__meta">
          <span className="wordmark">Learnivia</span>
          <span className="muted">© 2026 Learnivia · Free, volunteer-run tutoring</span>
        </div>
      </footer>
    </div>
  )
}
