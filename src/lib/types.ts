// Book data types matching our JSON format

export type AgeTier = 'baby' | 'toddler' | 'early_reader' | 'reader' | 'middle_grade' | 'young_adult';

export interface BookIllustration {
  description: string;
  alt: string;
  src?: string; // URL when we have actual images
  position?: string; // e.g., "after-paragraph-3"
  layout?: 'full-page' | 'half-page';
}

export interface BookPage {
  text: string;
  illustration?: BookIllustration;
}

export interface BookChapter {
  title: string;
  // Picture book / early reader format
  pages?: BookPage[];
  // Chapter book format
  content?: string;
  illustrations?: BookIllustration[];
}

export interface AccentIllustration {
  description: string;
  position: string;
  alt: string;
}

export interface BookMetadata {
  themes: string[];
  contentWarnings: string[];
  generatedAt: string;
  illustrationStyle: string;
  reviewedAt?: string;
}

export interface Book {
  id: string;
  title: string;
  ageTier: AgeTier;
  ageRange: [number, number];
  genre: string[];
  wordCount: number;
  readingLevel: string;
  synopsis: string;
  coverImage: string;
  chapters: BookChapter[];
  accentIllustrations?: AccentIllustration[];
  metadata: BookMetadata;
  quiz?: BookQuiz;
  puzzle?: BookPuzzle;
}

// Reader mode is determined by book age tier
export type ReaderMode = 'picture-book' | 'illustrated-chapter' | 'chapter-novel';

export function getReaderMode(ageTier: AgeTier): ReaderMode {
  switch (ageTier) {
    case 'baby':
    case 'toddler':
      return 'picture-book';
    case 'early_reader':
    case 'reader':
      return 'illustrated-chapter';
    case 'middle_grade':
    case 'young_adult':
      return 'chapter-novel';
  }
}

// Typography tier — split baby and toddler for larger fonts
export type TypographyTier = 'baby' | 'toddler' | 'developing' | 'confident' | 'advanced';

export function getTypographyTier(ageTier: AgeTier): TypographyTier {
  switch (ageTier) {
    case 'baby':
      return 'baby';
    case 'toddler':
      return 'toddler';
    case 'early_reader':
      return 'developing';
    case 'reader':
    case 'middle_grade':
      return 'confident';
    case 'young_adult':
      return 'advanced';
  }
}

// Theme
export type ReaderTheme = 'light' | 'sepia' | 'grey' | 'dark';

// Age tier display labels
export const AGE_TIER_LABELS: Record<AgeTier, string> = {
  baby: 'Baby (1-2)',
  toddler: 'Toddler (2-4)',
  early_reader: 'Early Reader (4-6)',
  reader: 'Reader (6-9)',
  middle_grade: 'Middle Grade (9-12)',
  young_adult: 'Young Adult (12-18)',
};

// Quiz types
export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface BookQuiz {
  questions: QuizQuestion[];
}

// Puzzle types
export interface PuzzleBlank {
  wordIndex: number; // position in the page text (word index)
  correctWord: string;
  distractors: string[];
}

export interface PuzzlePage {
  pageIndex: number; // maps to flattened reader page index
  blanks: PuzzleBlank[];
}

export interface BookPuzzle {
  pages: PuzzlePage[];
}

export const AGE_TIER_COLORS: Record<AgeTier, { bg: string; text: string }> = {
  baby: { bg: 'bg-pink-100', text: 'text-pink-800' },
  toddler: { bg: 'bg-green-100', text: 'text-green-800' },
  early_reader: { bg: 'bg-blue-100', text: 'text-blue-800' },
  reader: { bg: 'bg-orange-100', text: 'text-orange-800' },
  middle_grade: { bg: 'bg-purple-100', text: 'text-purple-800' },
  young_adult: { bg: 'bg-slate-800', text: 'text-teal-300' },
};
