"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-8">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p>Please try again. If it keeps happening, sign out and back in.</p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
