"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  UserProgress,
  QuizResult,
  PuzzleResult,
  getProgress,
  updateBookProgress,
  recordReadingTime,
  recordQuizResult,
  recordPuzzleResult,
} from "./storage";

interface ProgressContextValue {
  progress: UserProgress;
  updateBook: (bookId: string, totalPages: number, updates: Partial<import("./storage").BookProgress>) => void;
  addReadingTime: (bookId: string, totalPages: number, seconds: number) => void;
  addQuizResult: (bookId: string, totalPages: number, result: QuizResult) => void;
  addPuzzleResult: (bookId: string, totalPages: number, result: PuzzleResult) => void;
  refresh: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>({
    books: {},
    dailyReadingSeconds: {},
    lastActiveDate: "",
    streakDays: 0,
  });

  // Load from localStorage after hydration
  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const refresh = useCallback(() => {
    setProgress(getProgress());
  }, []);

  const updateBook = useCallback(
    (bookId: string, totalPages: number, updates: Partial<import("./storage").BookProgress>) => {
      const updated = updateBookProgress(bookId, totalPages, updates);
      setProgress(updated);
    },
    []
  );

  const addReadingTime = useCallback(
    (bookId: string, totalPages: number, seconds: number) => {
      const updated = recordReadingTime(bookId, totalPages, seconds);
      setProgress(updated);
    },
    []
  );

  const addQuizResult = useCallback(
    (bookId: string, totalPages: number, result: QuizResult) => {
      const updated = recordQuizResult(bookId, totalPages, result);
      setProgress(updated);
    },
    []
  );

  const addPuzzleResult = useCallback(
    (bookId: string, totalPages: number, result: PuzzleResult) => {
      const updated = recordPuzzleResult(bookId, totalPages, result);
      setProgress(updated);
    },
    []
  );

  return (
    <ProgressContext.Provider
      value={{ progress, updateBook, addReadingTime, addQuizResult, addPuzzleResult, refresh }}
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
