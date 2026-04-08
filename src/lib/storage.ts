// localStorage persistence layer for Literoo reading progress
// COPPA-safe: all data stays on-device, no PII collected

export interface QuizResult {
  score: number;
  total: number;
  completedAt: string; // ISO date
}

export interface PuzzleResult {
  score: number;
  total: number;
  completedAt: string;
}

export interface BookProgress {
  currentPage: number;
  totalPages: number;
  pagesRead: number[];
  completedAt: string | null;
  totalReadingSeconds: number;
  quizResults: QuizResult[];
  puzzleResults: PuzzleResult[];
  lastReadAt: string;
}

export interface UserProgress {
  books: Record<string, BookProgress>;
  dailyReadingSeconds: Record<string, number>; // ISO date string -> seconds
  lastActiveDate: string;
  streakDays: number;
}

const STORAGE_KEY = 'literoo_progress';

function getDefaultProgress(): UserProgress {
  return {
    books: {},
    dailyReadingSeconds: {},
    lastActiveDate: '',
    streakDays: 0,
  };
}

function getDefaultBookProgress(totalPages: number): BookProgress {
  return {
    currentPage: 0,
    totalPages,
    pagesRead: [],
    completedAt: null,
    totalReadingSeconds: 0,
    quizResults: [],
    puzzleResults: [],
    lastReadAt: new Date().toISOString(),
  };
}

export function getProgress(): UserProgress {
  if (typeof window === 'undefined') return getDefaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProgress();
    return JSON.parse(raw) as UserProgress;
  } catch {
    return getDefaultProgress();
  }
}

function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function updateBookProgress(
  bookId: string,
  totalPages: number,
  updates: Partial<BookProgress>
): UserProgress {
  const progress = getProgress();
  const book = progress.books[bookId] || getDefaultBookProgress(totalPages);

  progress.books[bookId] = { ...book, ...updates, lastReadAt: new Date().toISOString() };

  // Track unique pages read
  if (updates.currentPage !== undefined && !book.pagesRead.includes(updates.currentPage)) {
    progress.books[bookId].pagesRead = [...new Set([...book.pagesRead, updates.currentPage])];
  }

  // Check completion
  if (
    progress.books[bookId].pagesRead.length >= totalPages &&
    !progress.books[bookId].completedAt
  ) {
    progress.books[bookId].completedAt = new Date().toISOString();
  }

  saveProgress(progress);
  return progress;
}

export function recordReadingTime(bookId: string, totalPages: number, seconds: number): UserProgress {
  const progress = getProgress();
  const book = progress.books[bookId] || getDefaultBookProgress(totalPages);

  book.totalReadingSeconds += seconds;
  book.lastReadAt = new Date().toISOString();
  progress.books[bookId] = book;

  // Daily tracking
  const today = new Date().toISOString().split('T')[0];
  progress.dailyReadingSeconds[today] = (progress.dailyReadingSeconds[today] || 0) + seconds;

  // Streak calculation
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (progress.lastActiveDate === yesterday) {
    progress.streakDays += 1;
  } else if (progress.lastActiveDate !== today) {
    progress.streakDays = 1;
  }
  progress.lastActiveDate = today;

  saveProgress(progress);
  return progress;
}

export function recordQuizResult(bookId: string, totalPages: number, result: QuizResult): UserProgress {
  const progress = getProgress();
  const book = progress.books[bookId] || getDefaultBookProgress(totalPages);
  book.quizResults.push(result);
  progress.books[bookId] = book;
  saveProgress(progress);
  return progress;
}

export function recordPuzzleResult(bookId: string, totalPages: number, result: PuzzleResult): UserProgress {
  const progress = getProgress();
  const book = progress.books[bookId] || getDefaultBookProgress(totalPages);
  book.puzzleResults.push(result);
  progress.books[bookId] = book;
  saveProgress(progress);
  return progress;
}

// Analytics helpers
export function getTotalReadingTime(): number {
  const progress = getProgress();
  return Object.values(progress.books).reduce((sum, b) => sum + b.totalReadingSeconds, 0);
}

export function getCompletedBooksCount(): number {
  const progress = getProgress();
  return Object.values(progress.books).filter((b) => b.completedAt).length;
}

export function getStreak(): number {
  const progress = getProgress();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (progress.lastActiveDate === today || progress.lastActiveDate === yesterday) {
    return progress.streakDays;
  }
  return 0;
}

export function getDailyReadingData(days: number = 30): { date: string; seconds: number }[] {
  const progress = getProgress();
  const result: { date: string; seconds: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    result.push({ date, seconds: progress.dailyReadingSeconds[date] || 0 });
  }
  return result;
}
