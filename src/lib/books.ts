import { Book } from './types';
import fs from 'fs';
import path from 'path';

const SAMPLES_DIR = path.join(process.cwd(), 'src', 'data');

export function getAllBooks(): Book[] {
  const files = fs.readdirSync(SAMPLES_DIR).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const content = fs.readFileSync(path.join(SAMPLES_DIR, file), 'utf-8');
    return JSON.parse(content) as Book;
  }).sort((a, b) => {
    const tierOrder = ['baby', 'toddler', 'early_reader', 'reader', 'middle_grade', 'young_adult'];
    return tierOrder.indexOf(a.ageTier) - tierOrder.indexOf(b.ageTier);
  });
}

export function getBookById(id: string): Book | null {
  const books = getAllBooks();
  return books.find(b => b.id === id) || null;
}

export function getBooksByTier(tier: string): Book[] {
  return getAllBooks().filter(b => b.ageTier === tier);
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
