import { Book } from './types';
import fs from 'fs';
import path from 'path';

const SAMPLES_DIR = path.join(process.cwd(), 'src', 'data');
const HIDDEN_FILE = path.join(SAMPLES_DIR, 'hidden-books.json');

// Minimal book shape for library card listings — excludes heavy chapter content
// to keep the initial page payload small.
export type BookSummary = Pick<
  Book,
  'id' | 'title' | 'synopsis' | 'coverImage' | 'ageTier' | 'ageRange' | 'genre' | 'wordCount' | 'readingLevel'
> & { chapterCount: number };

function toSummary(book: Book): BookSummary {
  return {
    id: book.id,
    title: book.title,
    synopsis: book.synopsis,
    coverImage: book.coverImage,
    ageTier: book.ageTier,
    ageRange: book.ageRange,
    genre: book.genre,
    wordCount: book.wordCount,
    readingLevel: book.readingLevel,
    chapterCount: book.chapters?.length || 0,
  };
}

// Cache for the current process (per build/request in dev, persistent in prod)
let _allBooksCache: Book[] | null = null;
let _allSummariesCache: BookSummary[] | null = null;

function getHiddenBookIds(): Set<string> {
  try {
    const ids = JSON.parse(fs.readFileSync(HIDDEN_FILE, 'utf-8'));
    return new Set(ids);
  } catch {
    return new Set();
  }
}

// A book is "library-ready" iff it has valid text AND a cover image.
// Books without illustrations stay hidden until the pipeline generates them.
function isBookLibraryReady(book: Book): boolean {
  if (!book.title || book.title.length < 3) return false;
  if (!book.chapters || book.chapters.length === 0) return false;
  if (!book.synopsis || book.synopsis.length < 10) return false;
  // Must have a cover image (Supabase URL)
  if (!book.coverImage || !book.coverImage.startsWith('http')) return false;
  const hasText = book.chapters.some(
    (ch) =>
      (ch.pages && ch.pages.length > 0 && ch.pages.some((p) => p.text && p.text.length > 5)) ||
      (ch.content && ch.content.length > 20),
  );
  return hasText;
}

export function getAllBooks(): Book[] {
  if (_allBooksCache) return _allBooksCache;
  const hidden = getHiddenBookIds();
  const files = fs.readdirSync(SAMPLES_DIR).filter(f => f.endsWith('.json') && f !== 'illustration-admin.json' && f !== 'hidden-books.json');
  const books = files.map(file => {
    try {
      const content = fs.readFileSync(path.join(SAMPLES_DIR, file), 'utf-8');
      return JSON.parse(content) as Book;
    } catch {
      return null;
    }
  }).filter((book): book is Book => {
    if (!book) return false;
    if (hidden.has(book.id)) return false;
    return isBookLibraryReady(book);
  }).sort((a, b) => {
    const tierOrder = ['baby', 'toddler', 'early_reader', 'reader', 'middle_grade', 'young_adult'];
    return tierOrder.indexOf(a.ageTier) - tierOrder.indexOf(b.ageTier);
  });
  _allBooksCache = books;
  return books;
}

// Lightweight version that returns only summary fields — ideal for library grids.
// Dramatically smaller payload vs shipping full chapter/page content to the client.
export function getAllBookSummaries(): BookSummary[] {
  if (_allSummariesCache) return _allSummariesCache;
  _allSummariesCache = getAllBooks().map(toSummary);
  return _allSummariesCache;
}

export function getBookById(id: string): Book | null {
  const books = getAllBooks();
  return books.find(b => b.id === id) || null;
}

export function getBooksByTier(tier: string): Book[] {
  return getAllBooks().filter(b => b.ageTier === tier);
}

export function getBookSummariesByTier(tier: string): BookSummary[] {
  return getAllBookSummaries().filter(b => b.ageTier === tier);
}

export function getBooksByGenre(genre: string): Book[] {
  return getAllBooks().filter(b => b.genre.includes(genre));
}

// Get all unique genres across all books
export function getAllGenres(): string[] {
  const books = getAllBooks();
  const genres = new Set<string>();
  books.forEach(b => b.genre.forEach(g => genres.add(g)));
  return Array.from(genres).sort();
}

// Estimate reading time in minutes
export function estimateReadTime(wordCount: number): number {
  // Average child reading speed varies by age, use ~150 wpm as middle ground
  return Math.max(1, Math.ceil(wordCount / 150));
}

// Free books = our 6 sample books (one per tier)
const FREE_BOOK_IDS = new Set([
  'baby-peek-a-boo-moon-001',
  'toddler-grumpy-cloud-001',
  'early-reader-dragon-tooth-001',
  'reader-secret-treehouse-001',
  'mg-last-level-001',
  'ya-signal-noise-001',
  'test-baby-001',
  'test-toddler-001',
  'test-early-reader-001',
]);

export function getFreeBookIds(): string[] {
  return Array.from(FREE_BOOK_IDS);
}

export function isFreeBook(bookId: string): boolean {
  return FREE_BOOK_IDS.has(bookId);
}
