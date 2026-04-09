"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/lib/progress-context";
import {
  getTotalReadingTime,
  getCompletedBooksCount,
  getStreak,
  getDailyReadingData,
  getProgress,
} from "@/lib/storage";
import type { AgeTier } from "@/lib/types";
import { AGE_TIER_COLORS } from "@/lib/types";
import { StreakCounter } from "@/components/shared/StreakCounter";

interface BookMeta {
  id: string;
  title: string;
  ageTier: AgeTier;
  ageTierLabel: string;
  wordCount: number;
  totalPages: number;
  hasQuiz: boolean;
  hasPuzzle: boolean;
}

// Milestone definitions
const MILESTONES = [
  { id: "first-book", label: "First Book Read", icon: "\u{1F4D6}", description: "Read your very first book" },
  { id: "five-books", label: "5 Books Read", icon: "\u{1F4DA}", description: "Completed 5 books" },
  { id: "ten-books", label: "10 Books Read", icon: "\u{1F3C6}", description: "Completed 10 books" },
  { id: "30min-session", label: "30 Minute Session", icon: "\u23F1\uFE0F", description: "Read for 30 minutes in one day" },
  { id: "1hr-session", label: "1 Hour Session", icon: "\u{1F4AA}", description: "Read for a full hour in one day" },
  { id: "7day-streak", label: "7 Day Streak", icon: "\u{1F525}", description: "Read 7 days in a row" },
  { id: "30day-streak", label: "30 Day Streak", icon: "\u2B50", description: "Read 30 days in a row" },
  { id: "perfect-quiz", label: "Perfect Quiz", icon: "\u{1F4AF}", description: "Score 100% on a quiz" },
  { id: "all-puzzles", label: "Puzzle Master", icon: "\u{1F9E9}", description: "Complete all puzzles in a book" },
] as const;

function formatReadingTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function estimateReadingLevel(
  progress: ReturnType<typeof getProgress>,
  books: BookMeta[]
): string {
  const tierOrder: AgeTier[] = [
    "baby",
    "toddler",
    "early_reader",
    "reader",
    "middle_grade",
    "young_adult",
  ];
  const tierLabels: Record<AgeTier, string> = {
    baby: "Beginner",
    toddler: "Emerging",
    early_reader: "Early Reader",
    reader: "Reader",
    middle_grade: "Confident",
    young_adult: "Advanced",
  };

  let highestTierIndex = -1;

  for (const book of books) {
    const bp = progress.books[book.id];
    if (!bp || !bp.completedAt) continue;
    // Check quiz score > 70%
    const latestQuiz = bp.quizResults[bp.quizResults.length - 1];
    const passedQuiz = latestQuiz
      ? latestQuiz.score / latestQuiz.total >= 0.7
      : true; // No quiz = pass
    if (passedQuiz) {
      const idx = tierOrder.indexOf(book.ageTier);
      if (idx > highestTierIndex) highestTierIndex = idx;
    }
  }

  if (highestTierIndex < 0) return "Getting Started";
  return tierLabels[tierOrder[highestTierIndex]];
}

function checkMilestones(
  progress: ReturnType<typeof getProgress>,
  dailyData: { date: string; seconds: number }[]
): Set<string> {
  const earned = new Set<string>();
  const completedCount = getCompletedBooksCount();
  const streak = getStreak();

  if (completedCount >= 1) earned.add("first-book");
  if (completedCount >= 5) earned.add("five-books");
  if (completedCount >= 10) earned.add("ten-books");

  // Check daily reading maximums
  const maxDailySeconds = Math.max(0, ...dailyData.map((d) => d.seconds));
  if (maxDailySeconds >= 1800) earned.add("30min-session");
  if (maxDailySeconds >= 3600) earned.add("1hr-session");

  if (streak >= 7) earned.add("7day-streak");
  if (streak >= 30) earned.add("30day-streak");

  // Check quiz and puzzle scores
  for (const bp of Object.values(progress.books)) {
    for (const qr of bp.quizResults) {
      if (qr.score === qr.total && qr.total > 0) earned.add("perfect-quiz");
    }
    for (const pr of bp.puzzleResults) {
      if (pr.score === pr.total && pr.total > 0) earned.add("all-puzzles");
    }
  }

  return earned;
}

// ---------- SVG Bar Chart ----------
function ReadingChart({ data }: { data: { date: string; seconds: number }[] }) {
  const maxSeconds = Math.max(1, ...data.map((d) => d.seconds));
  const chartHeight = 160;
  const barGap = 2;
  const barWidth = Math.max(4, (100 - data.length * barGap) / data.length);
  const today = new Date().toISOString().split("T")[0];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${data.length * (barWidth + barGap)} ${chartHeight + 24}`}
        className="w-full min-w-[400px]"
        preserveAspectRatio="none"
      >
        {data.map((d, i) => {
          const barHeight = (d.seconds / maxSeconds) * chartHeight;
          const x = i * (barWidth + barGap);
          const y = chartHeight - barHeight;
          const isToday = d.date === today;
          const dayOfWeek = new Date(d.date + "T12:00:00").getDay();
          const showLabel = i % 7 === 0 || i === data.length - 1;

          return (
            <g key={d.date}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx={2}
                fill={isToday ? "#ee7a20" : d.seconds > 0 ? "#d6d3d1" : "#f5f5f4"}
                className="transition-all"
              />
              {/* Day label */}
              {showLabel && (
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 16}
                  textAnchor="middle"
                  className="fill-stone-400"
                  fontSize={8}
                >
                  {dayLabels[dayOfWeek]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------- Main Dashboard ----------
export default function DashboardClient({ books }: { books: BookMeta[] }) {
  const { progress } = useProgress();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-stone-400">Loading dashboard...</div>
      </div>
    );
  }

  const totalSeconds = getTotalReadingTime();
  const completedBooks = getCompletedBooksCount();
  const streak = getStreak();
  const dailyData = getDailyReadingData(30);
  const readingLevel = estimateReadingLevel(progress, books);
  const earnedMilestones = checkMilestones(progress, dailyData);

  // Get books the user has interacted with
  const interactedBooks = books.filter((b) => progress.books[b.id]);

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Dashboard title + streak */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 font-[family-name:var(--font-lexend)]">
              Reading Dashboard
            </h1>
            <p className="text-sm text-stone-500 mt-1">Track your child&apos;s reading journey</p>
          </div>
          <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-stone-100">
            <StreakCounter size="md" />
          </div>
        </div>
        {/* Stat Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Reading Time */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-xs text-stone-500 font-medium">
                Reading Time
              </span>
            </div>
            <p className="text-2xl font-bold text-stone-900 font-[family-name:var(--font-lexend)]">
              {formatReadingTime(totalSeconds)}
            </p>
          </div>

          {/* Books Completed */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <span className="text-xs text-stone-500 font-medium">
                Books Completed
              </span>
            </div>
            <p className="text-2xl font-bold text-stone-900 font-[family-name:var(--font-lexend)]">
              {completedBooks}
            </p>
          </div>

          {/* Reading Streak */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-orange-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 23c-3.6 0-8-2.4-8-7.7C4 10.6 8 4 12 1c4 3 8 9.6 8 14.3 0 5.3-4.4 7.7-8 7.7zm0-19.5C9.2 7 6 12.4 6 15.3 6 19 8.7 21 12 21s6-2 6-5.7C18 12.4 14.8 7 12 3.5z" />
                </svg>
              </div>
              <span className="text-xs text-stone-500 font-medium">
                Reading Streak
              </span>
            </div>
            <p className="text-2xl font-bold text-stone-900 font-[family-name:var(--font-lexend)]">
              {streak} {streak === 1 ? "day" : "days"}
            </p>
          </div>

          {/* Reading Level */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <span className="text-xs text-stone-500 font-medium">
                Reading Level
              </span>
            </div>
            <p className="text-2xl font-bold text-stone-900 font-[family-name:var(--font-lexend)]">
              {readingLevel}
            </p>
          </div>
        </section>

        {/* 30-Day Reading Chart */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <h2 className="text-lg font-bold text-stone-900 font-[family-name:var(--font-lexend)] mb-1">
            Reading Activity
          </h2>
          <p className="text-sm text-stone-500 mb-4">Last 30 days</p>
          {dailyData.some((d) => d.seconds > 0) ? (
            <ReadingChart data={dailyData} />
          ) : (
            <div className="h-40 flex items-center justify-center text-stone-400 text-sm">
              No reading activity yet. Start reading to see your chart!
            </div>
          )}
        </section>

        {/* Book Progress Cards */}
        <section>
          <h2 className="text-lg font-bold text-stone-900 font-[family-name:var(--font-lexend)] mb-4">
            Book Progress
          </h2>
          {interactedBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {interactedBooks.map((book) => {
                const bp = progress.books[book.id];
                if (!bp) return null;
                const progressPct = Math.round(
                  (bp.pagesRead.length / book.totalPages) * 100
                );
                const lastRead = new Date(bp.lastReadAt).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" }
                );
                const latestQuiz =
                  bp.quizResults[bp.quizResults.length - 1];
                const latestPuzzle =
                  bp.puzzleResults[bp.puzzleResults.length - 1];
                const tierColors = AGE_TIER_COLORS[book.ageTier];

                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-stone-900 truncate text-sm">
                          {book.title}
                        </h3>
                        <span
                          className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${tierColors.bg} ${tierColors.text}`}
                        >
                          {book.ageTierLabel}
                        </span>
                      </div>
                      <span className="text-xs text-stone-400 whitespace-nowrap ml-2">
                        {lastRead}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs text-stone-500 mb-1">
                        <span>{progressPct}% complete</span>
                        <span>
                          {bp.pagesRead.length}/{book.totalPages} pages
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Quiz / Puzzle scores */}
                    <div className="flex gap-3 text-xs">
                      {latestQuiz && (
                        <span className="text-stone-600">
                          Quiz:{" "}
                          <span className="font-semibold">
                            {latestQuiz.score}/{latestQuiz.total}
                          </span>
                        </span>
                      )}
                      {latestPuzzle && (
                        <span className="text-stone-600">
                          Puzzle:{" "}
                          <span className="font-semibold">
                            {latestPuzzle.score}/{latestPuzzle.total}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Continue reading link */}
                    <Link
                      href={`/book/${book.id}`}
                      className="mt-auto text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                    >
                      {bp.completedAt ? "Read Again" : "Continue Reading"}{" "}
                      &rarr;
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-stone-100">
              <p className="text-stone-500 mb-4">
                No books started yet. Head to the library to begin reading!
              </p>
              <Link
                href="/library"
                className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-600 transition-colors"
              >
                Browse Library
              </Link>
            </div>
          )}
        </section>

        {/* Reading Milestones */}
        <section>
          <h2 className="text-lg font-bold text-stone-900 font-[family-name:var(--font-lexend)] mb-4">
            Reading Milestones
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {MILESTONES.map((m) => {
              const earned = earnedMilestones.has(m.id);
              return (
                <div
                  key={m.id}
                  className={`rounded-2xl p-4 text-center border transition-all ${
                    earned
                      ? "bg-white border-brand-200 shadow-sm"
                      : "bg-stone-100 border-stone-100 opacity-60"
                  }`}
                >
                  <div className="text-3xl mb-2">
                    {earned ? (
                      m.icon
                    ) : (
                      <svg
                        className="w-8 h-8 mx-auto text-stone-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    )}
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      earned ? "text-stone-900" : "text-stone-400"
                    }`}
                  >
                    {m.label}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    {m.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer link to info pages */}
        <section className="text-center py-6">
          <Link
            href="/info"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            Tips & Resources for Parents &rarr;
          </Link>
        </section>
      </main>
    </div>
  );
}
