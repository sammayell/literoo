"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import {
  UserProgress,
  QuizResult,
  PuzzleResult,
  BookProgress,
  getProgress,
  updateBookProgress,
  recordReadingTime,
  recordQuizResult,
  recordPuzzleResult,
} from "./storage";
import {
  getCloudProgress,
  cloudUpdateBookProgress,
  cloudRecordReadingTime,
  cloudRecordQuizResult,
  cloudRecordPuzzleResult,
  migrateLocalToCloud,
} from "./cloud-storage";
import { useAuth } from "./auth-context";

interface ProgressContextValue {
  progress: UserProgress;
  updateBook: (bookId: string, totalPages: number, updates: Partial<BookProgress>) => void;
  addReadingTime: (bookId: string, totalPages: number, seconds: number) => void;
  addQuizResult: (bookId: string, totalPages: number, result: QuizResult) => void;
  addPuzzleResult: (bookId: string, totalPages: number, result: PuzzleResult) => void;
  refresh: () => void;
  syncing: boolean;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>({
    books: {},
    dailyReadingSeconds: {},
    lastActiveDate: "",
    streakDays: 0,
  });
  const [syncing, setSyncing] = useState(false);
  const hasMigrated = useRef(false);

  // Auth state — may be null during initial load
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch {
    // AuthProvider may not be available yet during initial render
  }

  const isAuthenticated = !!user;

  // Load progress: from cloud if authenticated, otherwise localStorage
  useEffect(() => {
    async function loadProgress() {
      const localProgress = getProgress();

      if (isAuthenticated) {
        setSyncing(true);
        try {
          // Try to get cloud progress
          const cloudProgress = await getCloudProgress();

          if (cloudProgress && Object.keys(cloudProgress.books).length > 0) {
            // Cloud has data — use it (merge with local if local has newer data)
            const merged = mergeProgress(localProgress, cloudProgress);
            setProgress(merged);
          } else if (Object.keys(localProgress.books).length > 0 && !hasMigrated.current) {
            // Cloud is empty but local has data — migrate local to cloud
            hasMigrated.current = true;
            await migrateLocalToCloud(localProgress);
            setProgress(localProgress);
          } else {
            setProgress(localProgress);
          }
        } catch (err) {
          console.error("Cloud sync failed, using local:", err);
          setProgress(localProgress);
        } finally {
          setSyncing(false);
        }
      } else {
        setProgress(localProgress);
      }
    }

    loadProgress();
  }, [isAuthenticated]);

  const refresh = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const cloudProgress = await getCloudProgress();
        if (cloudProgress) {
          setProgress(cloudProgress);
          return;
        }
      } catch {
        // Fall through to local
      }
    }
    setProgress(getProgress());
  }, [isAuthenticated]);

  const updateBook = useCallback(
    (bookId: string, totalPages: number, updates: Partial<BookProgress>) => {
      // Always write to localStorage (instant, offline)
      const updated = updateBookProgress(bookId, totalPages, updates);
      setProgress(updated);

      // Also write to cloud if authenticated (fire-and-forget)
      if (isAuthenticated) {
        cloudUpdateBookProgress(bookId, totalPages, {
          ...updates,
          pagesRead: updated.books[bookId]?.pagesRead,
          completedAt: updated.books[bookId]?.completedAt,
        }).catch(() => {}); // Silent fail — local is source of truth
      }
    },
    [isAuthenticated]
  );

  const addReadingTime = useCallback(
    (bookId: string, totalPages: number, seconds: number) => {
      const updated = recordReadingTime(bookId, totalPages, seconds);
      setProgress(updated);

      if (isAuthenticated) {
        cloudRecordReadingTime(bookId, totalPages, seconds).catch(() => {});
      }
    },
    [isAuthenticated]
  );

  const addQuizResult = useCallback(
    (bookId: string, totalPages: number, result: QuizResult) => {
      const updated = recordQuizResult(bookId, totalPages, result);
      setProgress(updated);

      if (isAuthenticated) {
        cloudRecordQuizResult(bookId, result).catch(() => {});
      }
    },
    [isAuthenticated]
  );

  const addPuzzleResult = useCallback(
    (bookId: string, totalPages: number, result: PuzzleResult) => {
      const updated = recordPuzzleResult(bookId, totalPages, result);
      setProgress(updated);

      if (isAuthenticated) {
        cloudRecordPuzzleResult(bookId, result).catch(() => {});
      }
    },
    [isAuthenticated]
  );

  return (
    <ProgressContext.Provider
      value={{ progress, updateBook, addReadingTime, addQuizResult, addPuzzleResult, refresh, syncing }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}

// Merge local and cloud progress, keeping the most recent data for each book
function mergeProgress(local: UserProgress, cloud: UserProgress): UserProgress {
  const merged: UserProgress = {
    books: { ...cloud.books },
    dailyReadingSeconds: { ...cloud.dailyReadingSeconds },
    lastActiveDate: cloud.lastActiveDate,
    streakDays: cloud.streakDays,
  };

  // Merge books — keep whichever has more progress
  for (const [bookId, localBp] of Object.entries(local.books)) {
    const cloudBp = merged.books[bookId];
    if (!cloudBp) {
      // Only in local — add it
      merged.books[bookId] = localBp;
    } else {
      // Both exist — keep the one with more pages read or more recent activity
      const localLastRead = new Date(localBp.lastReadAt).getTime();
      const cloudLastRead = new Date(cloudBp.lastReadAt).getTime();

      if (localBp.pagesRead.length > cloudBp.pagesRead.length || localLastRead > cloudLastRead) {
        merged.books[bookId] = {
          ...localBp,
          quizResults: [...cloudBp.quizResults, ...localBp.quizResults],
          puzzleResults: [...cloudBp.puzzleResults, ...localBp.puzzleResults],
        };
      }
    }
  }

  // Merge daily reading — keep the higher value for each day
  for (const [date, seconds] of Object.entries(local.dailyReadingSeconds)) {
    merged.dailyReadingSeconds[date] = Math.max(
      merged.dailyReadingSeconds[date] || 0,
      seconds
    );
  }

  return merged;
}
