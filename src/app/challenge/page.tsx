"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getChallenge,
  getChallengeStats,
  isChallengeComplete,
  type ChallengeState,
} from "@/lib/challenge";
import { GuaranteeBadge } from "@/components/shared/GuaranteeBadge";
import { Header } from "@/components/shared/Header";

export default function ChallengePage() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const c = getChallenge();
    if (!c) {
      router.push("/");
      return;
    }
    setChallenge(c);
    setLoaded(true);
  }, [router]);

  if (!loaded || !challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="text-stone-400 text-lg">Loading challenge...</div>
      </div>
    );
  }

  const allComplete = isChallengeComplete();
  const stats = getChallengeStats();
  const currentDayIndex = challenge.days.findIndex((d) => !d.completed);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <Header currentPage="challenge" />

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-2 text-center font-[family-name:var(--font-lexend)]">
          {challenge.childName}&apos;s Reading Challenge
        </h1>
        <p className="text-stone-500 text-center mb-10 font-[family-name:var(--font-literata)]">
          5 books in 5 days
        </p>

        {/* Progress bar */}
        <div className="flex items-center justify-center gap-0 mb-12">
          {challenge.days.map((day, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  day.completed
                    ? "bg-green-500 border-green-500 text-white"
                    : i === currentDayIndex
                    ? "bg-white border-brand-500 text-brand-600 ring-4 ring-brand-100"
                    : "bg-stone-100 border-stone-300 text-stone-400"
                }`}
              >
                {day.completed ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < challenge.days.length - 1 && (
                <div
                  className={`w-8 sm:w-12 h-1 ${
                    day.completed ? "bg-green-400" : "bg-stone-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Day cards */}
        <div className="space-y-4 mb-12">
          {challenge.days.map((day, i) => {
            const isCurrent = i === currentDayIndex;
            return (
              <div
                key={i}
                className={`bg-white rounded-xl border-2 p-5 transition-all ${
                  day.completed
                    ? "border-green-200 bg-green-50/50"
                    : isCurrent
                    ? "border-brand-500 shadow-md shadow-brand-100"
                    : "border-stone-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          day.completed
                            ? "text-green-600"
                            : isCurrent
                            ? "text-brand-500"
                            : "text-stone-400"
                        }`}
                      >
                        Day {i + 1}
                      </span>
                      {day.completed && (
                        <span className="text-green-500 text-sm">
                          <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-stone-900 font-[family-name:var(--font-literata)]">
                      {day.bookTitle}
                    </h3>
                    {day.completed && (
                      <p className="text-sm text-stone-500 mt-1">
                        {day.wordsRead.toLocaleString()} words &middot;{" "}
                        {day.minutesRead} min
                      </p>
                    )}
                  </div>
                  <div>
                    {day.completed ? (
                      <Link
                        href={`/book/${day.bookId}`}
                        className="text-sm text-green-600 hover:text-green-700 font-semibold"
                      >
                        Re-read
                      </Link>
                    ) : (
                      <Link
                        href={`/book/${day.bookId}`}
                        className={`inline-block px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                          isCurrent
                            ? "bg-brand-500 hover:bg-brand-600 text-white"
                            : "bg-stone-100 text-stone-400 cursor-not-allowed"
                        }`}
                      >
                        Start Reading
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Challenge results */}
        {allComplete && (
          <div className="mb-12">
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-8 text-white text-center shadow-xl">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 font-[family-name:var(--font-lexend)]">
                Challenge Complete!
              </h2>
              <p className="text-brand-100 mb-8 font-[family-name:var(--font-literata)]">
                {challenge.childName} crushed it. Here are the results:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  {
                    label: "Words Read",
                    value: stats.totalWords.toLocaleString(),
                  },
                  {
                    label: "Minutes Read",
                    value: stats.totalMinutes.toString(),
                  },
                  {
                    label: "Books Completed",
                    value: stats.booksRead.toString(),
                  },
                  {
                    label: "Reading Level",
                    value: challenge.ageTier
                      .replace("_", " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase()),
                  },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                    <div className="text-2xl font-bold font-[family-name:var(--font-lexend)]">
                      {stat.value}
                    </div>
                    <div className="text-xs text-brand-200 mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/pricing"
                className="inline-block bg-white text-brand-600 font-bold py-3.5 px-8 rounded-xl text-lg hover:bg-brand-50 transition-colors font-[family-name:var(--font-lexend)]"
              >
                Continue Reading &mdash; $99/year
              </Link>
              <div className="mt-4">
                <button className="text-brand-200 hover:text-white text-sm underline underline-offset-2 transition-colors">
                  Share Your Results
                </button>
              </div>
            </div>

            <div className="mt-6">
              <GuaranteeBadge size="lg" />
            </div>
          </div>
        )}

        {/* If not complete, show encouragement */}
        {!allComplete && (
          <div className="text-center text-stone-500 text-sm font-[family-name:var(--font-literata)]">
            <p>
              {stats.booksRead} of 5 books complete &middot;{" "}
              {stats.totalWords.toLocaleString()} words read so far
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
