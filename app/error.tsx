"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="route-error">
      <div>
        <h1>Something went wrong</h1>
        <p>Please try again. If it keeps happening, sign out and back in.</p>
        <p style={{ marginTop: "var(--space-md)" }}>
          <button type="button" className="btn btn--primary" onClick={reset}>
            Try again
          </button>
        </p>
      </div>
    </main>
  );
}
