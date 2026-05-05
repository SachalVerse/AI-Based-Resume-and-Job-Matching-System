"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-6 text-center gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-slate-400 max-w-md text-sm leading-relaxed">
        An unexpected error occurred. You can try again, or return to the home page.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="btn-primary px-6 py-3 rounded-xl"
        >
          Try again
        </button>
        <a
          href="/"
          className="glass px-6 py-3 rounded-xl font-medium text-slate-200 border border-white/10 hover:border-violet-500/40 transition-colors"
        >
          Home
        </a>
      </div>
    </div>
  );
}
