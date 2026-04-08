// Cloud storage layer — syncs reading progress to Supabase
// Used alongside localStorage for dual-write when authenticated

import { createClient } from "@/lib/supabase/client";
import type { BookProgress, QuizResult, PuzzleResult, UserProgress } from "./storage";

// Get the active child profile ID (first child for now)
async function getActiveChildId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: children } = await supabase
    .from("child_profiles")
    .select("id")
    .eq("parent_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  return children?.[0]?.id || null;
}

// ---- READ operations ----

export async function getCloudProgress(): Promise<UserProgress | null> {
  const childId = await getActiveChildId();
  if (!childId) return null;

  const supabase = createClient();

  // Fetch all progress data in parallel
  const [readingRes, quizRes, puzzleRes, dailyRes] = await Promise.all([
    supabase.from("reading_progress").select("*").eq("child_id", childId),
    supabase.from("quiz_results").select("*").eq("child_id", childId),
    supabase.from("puzzle_results").select("*").eq("child_id", childId),
    supabase.from("daily_reading").select("*").eq("child_id", childId).order("date", { ascending: false }).limit(90),
  ]);

  const books: Record<string, BookProgress> = {};

  // Build book progress from reading_progress table
  for (const rp of readingRes.data || []) {
    books[rp.book_id] = {
      currentPage: rp.current_page,
      totalPages: rp.total_pages,
      pagesRead: rp.pages_read || [],
      completedAt: rp.completed_at,
      totalReadingSeconds: rp.total_reading_seconds,
      quizResults: [],
      puzzleResults: [],
      lastReadAt: rp.last_read_at,
    };
  }

  // Attach quiz results to books
  for (const qr of quizRes.data || []) {
    if (!books[qr.book_id]) continue;
    books[qr.book_id].quizResults.push({
      score: qr.score,
      total: qr.total,
      completedAt: qr.completed_at,
    });
  }

  // Attach puzzle results to books
  for (const pr of puzzleRes.data || []) {
    if (!books[pr.book_id]) continue;
    books[pr.book_id].puzzleResults.push({
      score: pr.score,
      total: pr.total,
      completedAt: pr.completed_at,
    });
  }

  // Build daily reading map
  const dailyReadingSeconds: Record<string, number> = {};
  for (const dr of dailyRes.data || []) {
    dailyReadingSeconds[dr.date] = dr.seconds;
  }

  // Calculate streak
  let streakDays = 0;
  let lastActiveDate = "";
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Count consecutive days backwards from today/yesterday
  let checkDate = dailyReadingSeconds[today] ? today : yesterday;
  if (dailyReadingSeconds[checkDate]) {
    lastActiveDate = checkDate;
    while (dailyReadingSeconds[checkDate]) {
      streakDays++;
      const prev = new Date(checkDate + "T12:00:00");
      prev.setDate(prev.getDate() - 1);
      checkDate = prev.toISOString().split("T")[0];
    }
  }

  return {
    books,
    dailyReadingSeconds,
    lastActiveDate,
    streakDays,
  };
}

// ---- WRITE operations ----

export async function cloudUpdateBookProgress(
  bookId: string,
  totalPages: number,
  updates: Partial<BookProgress>
): Promise<void> {
  const childId = await getActiveChildId();
  if (!childId) return;

  const supabase = createClient();

  // Upsert reading progress
  const upsertData: Record<string, unknown> = {
    child_id: childId,
    book_id: bookId,
    total_pages: totalPages,
    last_read_at: new Date().toISOString(),
  };

  if (updates.currentPage !== undefined) upsertData.current_page = updates.currentPage;
  if (updates.pagesRead) upsertData.pages_read = updates.pagesRead;
  if (updates.completedAt !== undefined) upsertData.completed_at = updates.completedAt;
  if (updates.totalReadingSeconds !== undefined) upsertData.total_reading_seconds = updates.totalReadingSeconds;

  await supabase
    .from("reading_progress")
    .upsert(upsertData, { onConflict: "child_id,book_id" });
}

export async function cloudRecordReadingTime(
  bookId: string,
  totalPages: number,
  seconds: number
): Promise<void> {
  const childId = await getActiveChildId();
  if (!childId) return;

  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  // Update book's total reading seconds
  const { data: existing } = await supabase
    .from("reading_progress")
    .select("total_reading_seconds")
    .eq("child_id", childId)
    .eq("book_id", bookId)
    .single();

  const newTotal = (existing?.total_reading_seconds || 0) + seconds;

  await supabase
    .from("reading_progress")
    .upsert({
      child_id: childId,
      book_id: bookId,
      total_pages: totalPages,
      total_reading_seconds: newTotal,
      last_read_at: new Date().toISOString(),
    }, { onConflict: "child_id,book_id" });

  // Upsert daily reading
  const { data: dailyExisting } = await supabase
    .from("daily_reading")
    .select("seconds")
    .eq("child_id", childId)
    .eq("date", today)
    .single();

  const newDailySeconds = (dailyExisting?.seconds || 0) + seconds;

  await supabase
    .from("daily_reading")
    .upsert({
      child_id: childId,
      date: today,
      seconds: newDailySeconds,
    }, { onConflict: "child_id,date" });
}

export async function cloudRecordQuizResult(
  bookId: string,
  result: QuizResult
): Promise<void> {
  const childId = await getActiveChildId();
  if (!childId) return;

  const supabase = createClient();
  await supabase.from("quiz_results").insert({
    child_id: childId,
    book_id: bookId,
    score: result.score,
    total: result.total,
    completed_at: result.completedAt,
  });
}

export async function cloudRecordPuzzleResult(
  bookId: string,
  result: PuzzleResult
): Promise<void> {
  const childId = await getActiveChildId();
  if (!childId) return;

  const supabase = createClient();
  await supabase.from("puzzle_results").insert({
    child_id: childId,
    book_id: bookId,
    score: result.score,
    total: result.total,
    completed_at: result.completedAt,
  });
}

// ---- MIGRATION: localStorage → cloud ----

export async function migrateLocalToCloud(localProgress: UserProgress): Promise<void> {
  const childId = await getActiveChildId();
  if (!childId) return;

  const supabase = createClient();

  // Migrate each book's progress
  for (const [bookId, bp] of Object.entries(localProgress.books)) {
    // Upsert reading progress
    await supabase
      .from("reading_progress")
      .upsert({
        child_id: childId,
        book_id: bookId,
        current_page: bp.currentPage,
        total_pages: bp.totalPages,
        pages_read: bp.pagesRead,
        completed_at: bp.completedAt,
        total_reading_seconds: bp.totalReadingSeconds,
        last_read_at: bp.lastReadAt,
      }, { onConflict: "child_id,book_id" });

    // Insert quiz results
    for (const qr of bp.quizResults) {
      await supabase.from("quiz_results").insert({
        child_id: childId,
        book_id: bookId,
        score: qr.score,
        total: qr.total,
        completed_at: qr.completedAt,
      });
    }

    // Insert puzzle results
    for (const pr of bp.puzzleResults) {
      await supabase.from("puzzle_results").insert({
        child_id: childId,
        book_id: bookId,
        score: pr.score,
        total: pr.total,
        completed_at: pr.completedAt,
      });
    }
  }

  // Migrate daily reading data
  for (const [date, seconds] of Object.entries(localProgress.dailyReadingSeconds)) {
    if (seconds > 0) {
      await supabase
        .from("daily_reading")
        .upsert({
          child_id: childId,
          date,
          seconds,
        }, { onConflict: "child_id,date" });
    }
  }
}
