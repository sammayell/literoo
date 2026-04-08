"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { setSubscribed, getChildInfo } from "@/lib/subscription";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [childName, setChildName] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (sessionId && !activated) {
      setSubscribed(sessionId);
      setActivated(true);
    }
    const info = getChildInfo();
    setChildName(info.name);
  }, [sessionId, activated]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Checkmark */}
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-3 font-[family-name:var(--font-lexend)]">
          Welcome to Literoo!
        </h1>

        {childName && (
          <p className="text-lg text-stone-600 mb-2 font-[family-name:var(--font-literata)]">
            {childName}&apos;s reading adventure starts now.
          </p>
        )}

        <p className="text-stone-500 mb-10 font-[family-name:var(--font-literata)]">
          You now have full access to our entire library of 1,000+ books,
          quizzes, puzzles, and progress tracking.
        </p>

        <div className="space-y-3">
          <Link
            href="/library"
            className="block bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-8 rounded-xl text-lg transition-colors font-[family-name:var(--font-lexend)]"
          >
            Go to Your Library
          </Link>
          <Link
            href="/dashboard"
            className="block text-brand-600 hover:text-brand-700 font-semibold py-2 transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-green-50">
          <div className="text-stone-400 text-lg">Loading...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
