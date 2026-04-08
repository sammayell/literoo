// 5-Day Reading Challenge state management

export interface ChallengeDay {
  bookId: string;
  bookTitle: string;
  completed: boolean;
  wordsRead: number;
  minutesRead: number;
  completedAt: string | null;
}

export interface ChallengeState {
  active: boolean;
  childName: string;
  childAge: number;
  ageTier: string;
  startedAt: string;
  days: ChallengeDay[];
}

const STORAGE_KEY = 'literoo_challenge';

export function getChallenge(): ChallengeState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ChallengeState;
  } catch {
    return null;
  }
}

function save(state: ChallengeState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable
  }
}

// Book IDs for the challenge (our 6 sample books - one per tier)
const CHALLENGE_BOOKS: Record<string, { id: string; title: string }[]> = {
  baby: [{ id: 'baby-peek-a-boo-moon-001', title: 'Peek-a-Boo Moon' }],
  toddler: [{ id: 'toddler-grumpy-cloud-001', title: 'The Grumpy Little Cloud' }],
  early_reader: [{ id: 'early-reader-dragon-tooth-001', title: 'The Dragon Who Lost a Tooth' }],
  reader: [{ id: 'reader-secret-treehouse-001', title: 'The Secret of Whispering Treehouse' }],
  middle_grade: [{ id: 'mg-last-level-001', title: 'The Last Level' }],
  young_adult: [{ id: 'ya-signal-noise-001', title: 'Signal and Noise' }],
};

// Get books appropriate for the child's tier + adjacent tiers
function getBooksForChallenge(tier: string): { id: string; title: string }[] {
  const tierOrder = ['baby', 'toddler', 'early_reader', 'reader', 'middle_grade', 'young_adult'];
  const idx = tierOrder.indexOf(tier);
  const books: { id: string; title: string }[] = [];

  // Get books from current tier and adjacent tiers
  for (let i = Math.max(0, idx - 1); i <= Math.min(tierOrder.length - 1, idx + 1); i++) {
    const tierBooks = CHALLENGE_BOOKS[tierOrder[i]] || [];
    books.push(...tierBooks);
  }

  // Ensure we have at least 5 books (pad with repeats if needed for MVP)
  while (books.length < 5) {
    books.push(books[books.length % books.length]);
  }

  return books.slice(0, 5);
}

export function startChallenge(childName: string, childAge: number, ageTier: string): ChallengeState {
  const books = getBooksForChallenge(ageTier);

  const state: ChallengeState = {
    active: true,
    childName,
    childAge,
    ageTier,
    startedAt: new Date().toISOString(),
    days: books.map((book) => ({
      bookId: book.id,
      bookTitle: book.title,
      completed: false,
      wordsRead: 0,
      minutesRead: 0,
      completedAt: null,
    })),
  };

  save(state);
  return state;
}

export function markDayComplete(dayIndex: number, wordsRead: number, minutesRead: number): ChallengeState | null {
  const state = getChallenge();
  if (!state || dayIndex >= state.days.length) return null;

  state.days[dayIndex] = {
    ...state.days[dayIndex],
    completed: true,
    wordsRead,
    minutesRead,
    completedAt: new Date().toISOString(),
  };

  save(state);
  return state;
}

export function isChallengeComplete(): boolean {
  const state = getChallenge();
  if (!state) return false;
  return state.days.every((d) => d.completed);
}

export function getChallengeStats(): {
  totalWords: number;
  totalMinutes: number;
  booksRead: number;
  daysComplete: number;
} {
  const state = getChallenge();
  if (!state) return { totalWords: 0, totalMinutes: 0, booksRead: 0, daysComplete: 0 };

  return {
    totalWords: state.days.reduce((sum, d) => sum + d.wordsRead, 0),
    totalMinutes: state.days.reduce((sum, d) => sum + d.minutesRead, 0),
    booksRead: state.days.filter((d) => d.completed).length,
    daysComplete: state.days.filter((d) => d.completed).length,
  };
}

export function isChallengeBook(bookId: string): boolean {
  const state = getChallenge();
  if (!state) return false;
  return state.days.some((d) => d.bookId === bookId);
}

export function getChallengeDayForBook(bookId: string): number {
  const state = getChallenge();
  if (!state) return -1;
  return state.days.findIndex((d) => d.bookId === bookId);
}
