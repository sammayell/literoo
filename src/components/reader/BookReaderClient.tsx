"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Book,
  getReaderMode,
  getTypographyTier,
  ReaderTheme,
  AGE_TIER_LABELS,
  AGE_TIER_COLORS,
} from "@/lib/types";
import { useProgress } from "@/lib/progress-context";
import { getTTS } from "@/lib/tts";
import { isSubscribed } from "@/lib/subscription";
import { isChallengeBook, getChallengeDayForBook, markDayComplete } from "@/lib/challenge";
import { UpgradePrompt } from "@/components/paywall/UpgradePrompt";
import { fireConfetti } from "@/lib/confetti";
import QuizMode from "@/components/quiz/QuizMode";
import PuzzleMode from "@/components/puzzle/PuzzleMode";

// Flatten book into pages for the reader
interface ReaderPage {
  type: "title" | "text" | "illustration-note" | "chapter-start" | "completion";
  chapterIndex: number;
  chapterTitle: string;
  content: string;
  illustrationDesc?: string;
  illustrationAlt?: string;
  illustrationLayout?: string;
  illustrationSrc?: string;
  narrationSrc?: string;
}

function flattenBookToPages(book: Book): ReaderPage[] {
  const pages: ReaderPage[] = [];
  const mode = getReaderMode(book.ageTier);

  // Title page
  pages.push({
    type: "title",
    chapterIndex: -1,
    chapterTitle: "",
    content: book.title,
  });

  book.chapters.forEach((chapter, ci) => {
    if (mode === "picture-book") {
      // Picture book: each page with its illustration is one reader page
      if (chapter.pages) {
        chapter.pages.forEach((page) => {
          pages.push({
            type: "text",
            chapterIndex: ci,
            chapterTitle: chapter.title,
            content: page.text,
            illustrationDesc: page.illustration?.description,
            illustrationAlt: page.illustration?.alt,
            illustrationLayout: page.illustration?.layout || "full-page",
            illustrationSrc: page.illustration?.src,
            narrationSrc: page.narration?.src,
          });
        });
      }
    } else {
      // Chapter books: chapter title page + content pages
      pages.push({
        type: "chapter-start",
        chapterIndex: ci,
        chapterTitle: chapter.title,
        content: chapter.title,
        // For chapter-style books the narration is for the whole chapter
        narrationSrc: chapter.narration?.src,
      });

      if (chapter.pages) {
        // Early reader format with pages
        chapter.pages.forEach((page) => {
          pages.push({
            type: "text",
            chapterIndex: ci,
            chapterTitle: chapter.title,
            content: page.text,
            illustrationDesc: page.illustration?.description,
            illustrationAlt: page.illustration?.alt,
            illustrationLayout: page.illustration?.layout,
            illustrationSrc: page.illustration?.src,
            narrationSrc: page.narration?.src,
          });
        });
      } else if (chapter.content) {
        // Chapter book format: split content into readable chunks
        const paragraphs = chapter.content.split("\n\n").filter((p) => p.trim());

        // Group paragraphs into pages (~3-5 paragraphs per page depending on length)
        const maxCharsPerPage = mode === "chapter-novel" ? 1500 : 1000;
        let currentPageContent = "";
        let currentPageIllustrations: typeof chapter.illustrations = [];

        paragraphs.forEach((para, pi) => {
          const wouldExceed =
            currentPageContent.length + para.length > maxCharsPerPage &&
            currentPageContent.length > 0;

          if (wouldExceed) {
            // Emit current page
            const ill = currentPageIllustrations?.[0];
            pages.push({
              type: "text",
              chapterIndex: ci,
              chapterTitle: chapter.title,
              content: currentPageContent.trim(),
              illustrationDesc: ill?.description,
              illustrationAlt: ill?.alt,
              illustrationSrc: ill?.src,
            });
            currentPageContent = "";
            currentPageIllustrations = [];
          }

          currentPageContent += para + "\n\n";

          // Check if any illustration is positioned after this paragraph
          if (chapter.illustrations) {
            const matchingIll = chapter.illustrations.find(
              (ill) => ill.position === `after-paragraph-${pi + 1}`
            );
            if (matchingIll) {
              currentPageIllustrations = [matchingIll];
            }
          }
        });

        // Emit final page
        if (currentPageContent.trim()) {
          const ill = currentPageIllustrations?.[0];
          pages.push({
            type: "text",
            chapterIndex: ci,
            chapterTitle: chapter.title,
            content: currentPageContent.trim(),
            illustrationDesc: ill?.description,
            illustrationAlt: ill?.alt,
          });
        }
      }
    }
  });

  // Add completion page at the end
  pages.push({
    type: "completion",
    chapterIndex: -1,
    chapterTitle: "",
    content: "The End",
  });

  return pages;
}

export function BookReaderClient({ book, isFree = true }: { book: Book; isFree?: boolean }) {
  const mode = getReaderMode(book.ageTier);
  const typographyTier = getTypographyTier(book.ageTier);
  const pages = flattenBookToPages(book);
  const colors = AGE_TIER_COLORS[book.ageTier];
  const { updateBook, addReadingTime } = useProgress();

  // ALL hooks must be declared before any early returns
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const [theme, setTheme] = useState<ReaderTheme>("light");
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(0);
  const [showNavHint, setShowNavHint] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [readerMode, setReaderMode] = useState<"read" | "quiz" | "puzzle">("read");
  const [aiReadActive, setAiReadActive] = useState(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  // Index of the first page that has a Supabase-hosted illustration. We show
  // an indeterminate loading bar at the top of the reader until that image
  // has loaded (or we hit a failsafe timeout) so the first paint isn't a
  // blank text page waiting for a ~1MB PNG.
  const firstImagePageIndex = pages.findIndex((p) => !!p.illustrationSrc);
  const hasAnyImage = firstImagePageIndex >= 0;
  const [firstImageLoaded, setFirstImageLoaded] = useState(!hasAnyImage);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const readingTimerRef = useRef<number>(0);

  // Paywall check — DISABLED for free launch (all books free)
  useEffect(() => {
    // if (!isFree && !isSubscribed() && !isChallengeBook(book.id)) {
    //   setShowPaywall(true);
    // }
    setHasCheckedAccess(true);
  }, [isFree, book.id]);

  // Fire confetti when reaching the completion page
  const completionPageIndex = pages.findIndex((p) => p.type === "completion");
  useEffect(() => {
    if (currentPage === completionPageIndex && completionPageIndex >= 0) {
      const t = setTimeout(() => fireConfetti(), 300);
      return () => clearTimeout(t);
    }
  }, [currentPage, completionPageIndex]);

  // Failsafe: hide the initial loading bar after 4s even if the first image
  // never loads (network failure, CDN hiccup, etc.) — the text is still
  // readable, the bar shouldn't stick around forever.
  useEffect(() => {
    if (firstImageLoaded) return;
    const t = window.setTimeout(() => setFirstImageLoaded(true), 4000);
    return () => window.clearTimeout(t);
  }, [firstImageLoaded]);

  // NO early returns — hooks must always run. Paywall renders conditionally in JSX below.

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice(
      "ontouchstart" in window || navigator.maxTouchPoints > 0
    );
  }, []);

  // Reading timer — records time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && readerMode === "read") {
        readingTimerRef.current += 30;
        if (readingTimerRef.current >= 30) {
          addReadingTime(book.id, pages.length, 30);
          readingTimerRef.current = 0;
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [book.id, pages.length, addReadingTime, readerMode]);

  // Track page progress
  useEffect(() => {
    updateBook(book.id, pages.length, { currentPage });
  }, [currentPage, book.id, pages.length, updateBook]);

  // HTMLAudioElement used for ElevenLabs MP3 playback
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  // Audio progress for the current page (0..1)
  const [audioProgress, setAudioProgress] = useState(0);
  // Does the current page have MP3 narration available?
  const pageHasMP3 = pages[currentPage]?.narrationSrc != null;
  // Does this book have narration at all? (check if any page has an MP3)
  const bookHasNarration = pages.some((p) => !!p.narrationSrc);

  // Refs for functions that reference each other (avoid stale closures)
  const goToPageRef = useRef<(n: number) => void>(() => {});
  const startAIReadRef = useRef<() => void>(() => {});
  const stopAIReadRef = useRef<() => void>(() => {});
  // Flag to suppress auto-advance after an intentional stop
  const manuallyStoppedRef = useRef(false);

  // AI Read mode — prefers ElevenLabs MP3, falls back to browser TTS
  const startAIRead = useCallback(() => {
    const page = pages[currentPage];
    if (!page || (page.type !== "text" && page.type !== "chapter-start")) return;

    // Stop anything that's currently playing (but don't mark as manual stop)
    const tts = getTTS();
    tts.stop();
    if (narrationAudioRef.current) {
      narrationAudioRef.current.onended = null;
      narrationAudioRef.current.pause();
      narrationAudioRef.current = null;
    }

    manuallyStoppedRef.current = false;
    setAudioProgress(0);

    const advanceToNext = () => {
      if (manuallyStoppedRef.current) return;
      setHighlightedWordIndex(-1);
      // Use current state via the ref, not the captured closure value
      goToPageRef.current((currentPage + 1 >= pages.length) ? pages.length - 1 : currentPage + 1);
      // If there's a next page, continue reading there
      if (currentPage + 1 < pages.length) {
        setTimeout(() => {
          if (!manuallyStoppedRef.current) startAIReadRef.current();
        }, 400);
      } else {
        setAiReadActive(false);
      }
    };

    // Only play the real ElevenLabs MP3 narration — never fall back to robot TTS.
    if (!page.narrationSrc) {
      // Silent no-op — button should be disabled when there's no MP3 anyway.
      return;
    }
    const audio = new Audio(page.narrationSrc);
    audio.playbackRate = ttsSpeed;
    audio.preload = "auto";
    audio.addEventListener("ended", advanceToNext);
    audio.addEventListener("timeupdate", () => {
      if (audio.duration > 0) {
        setAudioProgress(audio.currentTime / audio.duration);
      }
    });
    audio.addEventListener("error", () => {
      narrationAudioRef.current = null;
      setAiReadActive(false);
    });
    narrationAudioRef.current = audio;
    audio.play().catch(() => {
      setAiReadActive(false);
    });
    setAiReadActive(true);
  }, [currentPage, pages, ttsSpeed]);

  const stopAIRead = useCallback(() => {
    manuallyStoppedRef.current = true;
    const tts = getTTS();
    tts.stop();
    if (narrationAudioRef.current) {
      narrationAudioRef.current.onended = null;
      narrationAudioRef.current.pause();
      narrationAudioRef.current = null;
    }
    setAiReadActive(false);
    setHighlightedWordIndex(-1);
    setAudioProgress(0);
  }, []);

  // Keep refs pointing to latest functions so closures in advanceToNext are fresh
  useEffect(() => {
    startAIReadRef.current = startAIRead;
    stopAIReadRef.current = stopAIRead;
  }, [startAIRead, stopAIRead]);

  const toggleAIRead = useCallback(() => {
    if (aiReadActive) {
      stopAIRead();
    } else {
      startAIRead();
    }
  }, [aiReadActive, startAIRead, stopAIRead]);

  const totalPages = pages.length;
  const progress = totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 100;

  const goToPage = useCallback(
    (pageNum: number) => {
      const clamped = Math.max(0, Math.min(pageNum, totalPages - 1));
      setCurrentPage(clamped);
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          left: clamped * window.innerWidth,
          behavior: "smooth",
        });
      }
    },
    [totalPages]
  );

  // Keep ref pointing to latest goToPage for use inside startAIRead
  useEffect(() => {
    goToPageRef.current = goToPage;
  }, [goToPage]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
    setShowNavHint(false);
  }, [currentPage, goToPage]);
  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
    setShowNavHint(false);
  }, [currentPage, goToPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextPage();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevPage();
      }
      if (e.key === "Escape") {
        setShowUI((prev) => !prev);
        setShowSettings(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [nextPage, prevPage]);

  // Touch swipe navigation — the .tap-zone overlays cover the scroll container
  // so native scroll-snap swipes never reach it. Detect swipes manually and
  // preventDefault on touchend to suppress the emulated click on tap zones.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        touchStartRef.current = null;
        return;
      }
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    };
    const onTouchEnd = (e: TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const dt = Date.now() - start.t;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      // Horizontal swipe: >=50px, clearly more horizontal than vertical, under 600ms
      if (absDx >= 50 && absDx > absDy * 1.5 && dt < 600) {
        e.preventDefault(); // suppresses the emulated click on the tap zone
        if (dx < 0) nextPage();
        else prevPage();
      }
    };
    const onTouchCancel = () => {
      touchStartRef.current = null;
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [nextPage, prevPage]);

  // Scroll snap detection
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let timeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const page = Math.round(container.scrollLeft / window.innerWidth);
        setCurrentPage(page);
      }, 100);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Determine if dark mode applies (only for reflowable text, not picture books)
  const applyTheme = mode !== "picture-book" ? theme : "light";

  const fontSizeAdjust = `${fontSize * 2}px`;

  // Paywall and loading states (rendered here, not as early returns, to preserve hook order)
  if (showPaywall) {
    return (
      <UpgradePrompt
        trigger="This book"
        bookTitle={book.title}
        onClose={() => { window.location.href = "/library"; }}
      />
    );
  }

  if (!hasCheckedAccess) {
    return <div className="w-screen h-screen bg-white" />;
  }

  // Quiz mode — render QuizMode with a back button
  if (readerMode === "quiz" && book.quiz) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-2xl mx-auto p-4">
          <button
            onClick={() => setReaderMode("read")}
            className="mb-4 inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 font-medium"
          >
            ← Back to book
          </button>
          <QuizMode quiz={book.quiz} bookId={book.id} />
        </div>
      </div>
    );
  }

  // Puzzle mode — render PuzzleMode with a back button
  if (readerMode === "puzzle" && book.puzzle) {
    // Collect page texts for the puzzle to reference
    const pageTexts: string[] = [];
    for (const ch of book.chapters) {
      if (ch.pages) {
        for (const p of ch.pages) {
          pageTexts.push(p.text || "");
        }
      } else if (ch.content) {
        pageTexts.push(ch.content);
      }
    }
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-2xl mx-auto p-4">
          <button
            onClick={() => setReaderMode("read")}
            className="mb-4 inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 font-medium"
          >
            ← Back to book
          </button>
          <PuzzleMode puzzle={book.puzzle} bookId={book.id} pageTexts={pageTexts} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      data-reader-theme={applyTheme}
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{
        backgroundColor: "var(--reader-bg, #ffffff)",
        color: "var(--reader-text, #1a1a1a)",
      }}
    >
      {/* Initial image loading bar — indeterminate sweep until the first
          illustration loads (or the 4s failsafe fires). Sits above the top
          bar so it's always visible at first paint. */}
      {!firstImageLoaded && (
        <div className="initial-load-bar" aria-hidden="true" />
      )}

      {/* Top bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          showUI ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div
          className="flex items-center justify-between px-4 py-3 backdrop-blur-md"
          style={{
            backgroundColor:
              applyTheme === "dark"
                ? "rgba(18,18,18,0.9)"
                : "rgba(255,255,255,0.9)",
          }}
        >
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium opacity-70 hover:opacity-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Library
          </Link>

          <div className="text-center">
            <p className="text-xs opacity-50 truncate max-w-[200px]">
              {book.title}
            </p>
            <p className="text-xs opacity-40">
              {currentPage + 1} / {totalPages}
            </p>
          </div>

          {/* Read-aloud button — only shown for books with real narration.
              We do NOT fall back to browser TTS (robot voice). If the book
              doesn't have MP3 narration yet, the button simply isn't there. */}
          {bookHasNarration ? (
            <button
              onClick={toggleAIRead}
              disabled={!pageHasMP3}
              className={`relative flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full transition-all overflow-hidden ${
                aiReadActive
                  ? "bg-brand-500 text-white shadow-md"
                  : !pageHasMP3
                  ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
              aria-label={aiReadActive ? "Pause reading" : "Read aloud"}
              title={
                aiReadActive
                  ? "Pause"
                  : !pageHasMP3
                  ? "No audio for this page"
                  : "Read aloud"
              }
            >
              {/* Progress bar fill */}
              {aiReadActive && (
                <div
                  className="absolute inset-y-0 left-0 bg-white/25 transition-[width] duration-100 ease-linear pointer-events-none"
                  style={{ width: `${audioProgress * 100}%` }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {aiReadActive ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                    <span className="text-xs font-semibold hidden sm:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span className="text-xs font-semibold hidden sm:inline">Read aloud</span>
                  </>
                )}
              </span>
            </button>
          ) : (
            // Placeholder spacer so the top bar keeps its layout
            <div className="w-10" aria-hidden="true" />
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Reader settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div
            className="mx-4 mb-2 p-4 rounded-xl backdrop-blur-md shadow-lg"
            style={{
              backgroundColor:
                applyTheme === "dark"
                  ? "rgba(30,30,30,0.95)"
                  : "rgba(255,255,255,0.95)",
            }}
          >
            {/* Theme selector */}
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-2">
                Theme
              </p>
              <div className="flex gap-2">
                {(
                  [
                    { key: "light", label: "Light", bg: "#fff", text: "#1a1a1a" },
                    { key: "sepia", label: "Sepia", bg: "#f8f0e3", text: "#3b2f1e" },
                    { key: "grey", label: "Grey", bg: "#e8e8e8", text: "#2a2a2a" },
                    { key: "dark", label: "Dark", bg: "#121212", text: "#e0e0e0" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                      theme === t.key
                        ? "border-brand-500 scale-105"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: t.bg, color: t.text }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {mode === "picture-book" && (
                <p className="text-xs opacity-40 mt-1">
                  Theme changes don&apos;t apply to picture book illustrations
                </p>
              )}
            </div>

            {/* Font size */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-2">
                Font Size
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFontSize(Math.max(-2, fontSize - 1))}
                  className="w-10 h-10 rounded-lg border border-current/20 flex items-center justify-center text-lg"
                >
                  A
                </button>
                <input
                  type="range"
                  min={-2}
                  max={4}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => setFontSize(Math.min(4, fontSize + 1))}
                  className="w-10 h-10 rounded-lg border border-current/20 flex items-center justify-center text-2xl font-bold"
                >
                  A
                </button>
              </div>
            </div>

            {/* Reading speed (AI Read) */}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-2">
                Read-Aloud Speed
              </p>
              <div className="flex gap-2">
                {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      setTtsSpeed(speed);
                      const tts = getTTS();
                      tts.setRate(speed);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      ttsSpeed === speed
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-current/20"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating pill removed — all audio controls are now in the top bar. */}

      {/* Main scroll container */}
      <div ref={scrollRef} className="reader-scroll-container">
        {pages.map((page, i) => (
          <div
            key={i}
            className={
              mode === "picture-book" ? "picture-book-page" : "reader-page"
            }
            style={{
              backgroundColor:
                mode === "picture-book" && page.type !== "title"
                  ? page.illustrationDesc
                    ? "#f0ebe3" // warm bg for illustrated pages
                    : "var(--reader-bg)"
                  : "var(--reader-bg)",
            }}
          >
            {page.type === "title" ? (
              // Title page
              <div className="text-center max-w-lg mx-auto px-8">
                <span
                  className={`inline-block ${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6`}
                >
                  {AGE_TIER_LABELS[book.ageTier]}
                </span>
                <h1
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 font-[family-name:var(--font-literata)]"
                  style={{ color: "var(--reader-text)" }}
                >
                  {book.title}
                </h1>
                <p
                  className="text-sm sm:text-base opacity-60 font-[family-name:var(--font-literata)] italic"
                  style={{ color: "var(--reader-text)" }}
                >
                  {book.synopsis}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {book.genre.map((g) => (
                    <span
                      key={g}
                      className="bg-black/5 dark:bg-white/10 px-3 py-1 rounded-full text-xs"
                    >
                      {g}
                    </span>
                  ))}
                </div>
                {/* Animated navigation hint */}
                <div className="mt-10 flex flex-col items-center gap-3 animate-pulse">
                  {isTouchDevice ? (
                    /* Mobile/tablet: swipe hint */
                    <div className="flex items-center gap-3 text-stone-400">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-[swipeHint_2s_ease-in-out_infinite]">
                        <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" />
                        <path d="M10 19v-3.96 3.15" />
                        <path d="M7 19h5" />
                        <polyline points="15 14 18 11 21 14" />
                        <line x1="18" y1="11" x2="18" y2="20" />
                      </svg>
                      <span className="text-sm font-medium">Swipe to read</span>
                      <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className="text-stone-400">
                        <path d="M8 12H24M24 12L19 7M24 12L19 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-[slideRight_1.5s_ease-in-out_infinite]" />
                      </svg>
                    </div>
                  ) : (
                    /* Desktop: keyboard + click hints */
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-4 text-stone-400">
                        {/* Left arrow key */}
                        <div className="flex items-center gap-2">
                          <kbd className="px-2.5 py-1.5 bg-stone-200 text-stone-500 rounded-md text-xs font-mono border border-stone-300 shadow-sm">
                            &larr;
                          </kbd>
                          <span className="text-xs">Back</span>
                        </div>
                        <div className="w-px h-4 bg-stone-300" />
                        {/* Right arrow key */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Next</span>
                          <kbd className="px-2.5 py-1.5 bg-stone-200 text-stone-500 rounded-md text-xs font-mono border border-stone-300 shadow-sm">
                            &rarr;
                          </kbd>
                        </div>
                        <div className="w-px h-4 bg-stone-300" />
                        {/* Spacebar */}
                        <div className="flex items-center gap-2">
                          <kbd className="px-4 py-1.5 bg-stone-200 text-stone-500 rounded-md text-xs font-mono border border-stone-300 shadow-sm">
                            Space
                          </kbd>
                        </div>
                      </div>
                      <p className="text-xs text-stone-400">
                        or tap the edges of the screen
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : page.type === "chapter-start" ? (
              // Chapter title page
              <div className="text-center max-w-lg mx-auto px-8">
                <p className="text-sm uppercase tracking-widest opacity-30 mb-4">
                  Chapter {page.chapterIndex + 1}
                </p>
                <h2
                  className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-literata)]"
                  style={{ color: "var(--reader-text)" }}
                >
                  {page.chapterTitle}
                </h2>
              </div>
            ) : page.type === "completion" ? (
              // Animated completion page with celebrations
              <div className="text-center max-w-md mx-auto px-8 relative">
                {/* Sparkle decorations */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <span className="animate-sparkle absolute top-4 left-8 text-2xl" style={{ animationDelay: "0s" }}>✨</span>
                  <span className="animate-sparkle absolute top-12 right-6 text-xl" style={{ animationDelay: "0.5s" }}>⭐</span>
                  <span className="animate-sparkle absolute top-2 right-20 text-lg" style={{ animationDelay: "1s" }}>✨</span>
                  <span className="animate-sparkle absolute bottom-32 left-4 text-xl" style={{ animationDelay: "0.3s" }}>🌟</span>
                  <span className="animate-sparkle absolute bottom-40 right-10 text-lg" style={{ animationDelay: "0.8s" }}>⭐</span>
                </div>

                {/* Main star */}
                <div className="animate-celebrate-in text-6xl sm:text-7xl mb-6">
                  {book.ageTier === "baby" || book.ageTier === "toddler" ? "🌟" : "🎉"}
                </div>

                {/* Title */}
                <h2
                  className="animate-stagger-fade-up text-3xl sm:text-4xl font-bold mb-3 font-[family-name:var(--font-literata)]"
                  style={{ color: "var(--reader-text)", animationDelay: "0.15s", opacity: 0 }}
                >
                  The End
                </h2>

                {/* Age-appropriate encouragement */}
                <p
                  className="animate-stagger-fade-up text-base sm:text-lg mb-2 font-semibold"
                  style={{ color: "var(--reader-accent)", animationDelay: "0.3s", opacity: 0 }}
                >
                  {(() => {
                    const tier = book.ageTier;
                    const msgs =
                      tier === "baby" || tier === "toddler"
                        ? ["You did it!", "Storytime superstar!", "What a great listener!", "Wonderful!"]
                        : tier === "early_reader"
                        ? ["Amazing reading!", "Your brain just grew!", "Way to go, reader!", "Awesome job!"]
                        : ["Another one down!", "Great read!", "Keep it up!", "Nicely done!"];
                    return msgs[Math.floor(Math.random() * msgs.length)];
                  })()}
                </p>

                {/* Stats card */}
                <div
                  className="animate-stagger-fade-up inline-flex items-center gap-4 rounded-xl px-5 py-3 mb-8 text-sm"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--reader-text) 6%, transparent)",
                    color: "var(--reader-text-secondary)",
                    animationDelay: "0.45s",
                    opacity: 0,
                  }}
                >
                  <span>{book.chapters.length} chapter{book.chapters.length !== 1 ? "s" : ""}</span>
                  <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                  <span>{book.wordCount.toLocaleString()} words</span>
                </div>

                {/* Action buttons */}
                <div
                  className="animate-stagger-fade-up flex flex-col gap-3 max-w-xs mx-auto"
                  style={{ animationDelay: "0.6s", opacity: 0 }}
                >
                  {book.quiz && (
                    <button
                      onClick={() => setReaderMode("quiz")}
                      className="w-full py-3 px-6 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
                      </svg>
                      Take the Quiz!
                    </button>
                  )}
                  {book.puzzle && (
                    <button
                      onClick={() => setReaderMode("puzzle")}
                      className="w-full py-3 px-6 bg-purple-500 text-white rounded-xl font-semibold text-sm hover:bg-purple-600 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                    >
                      Try the Word Puzzle!
                    </button>
                  )}

                  {isChallengeBook(book.id) && (
                    <Link
                      href="/challenge"
                      className="w-full py-3 px-6 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 active:scale-[0.97] transition-all text-center"
                      onClick={() => {
                        const dayIdx = getChallengeDayForBook(book.id);
                        if (dayIdx >= 0) {
                          markDayComplete(dayIdx, book.wordCount, Math.ceil(book.wordCount / 150));
                        }
                      }}
                    >
                      Back to Challenge →
                    </Link>
                  )}

                  <Link
                    href="/library"
                    className="w-full py-3 px-6 bg-stone-200 text-stone-700 rounded-xl font-semibold text-sm hover:bg-stone-300 active:scale-[0.97] transition-all text-center"
                  >
                    Back to Library
                  </Link>
                  <Link
                    href="/dashboard"
                    className="text-xs text-brand-500 hover:underline mt-2"
                  >
                    View your reading progress →
                  </Link>
                </div>

                {/* More books to read */}
                <MoreBooksToRead tier={book.ageTier} excludeId={book.id} />
              </div>
            ) : (() => {
              // Content page — build illustration + text blocks, then choose layout
              const hasIll = !!(page.illustrationSrc || page.illustrationDesc);

              const illustrationBlock = hasIll ? (
                <div
                  className={`reader-split-image ${
                    mode === "picture-book"
                      ? "w-full max-w-2xl mb-6 lg:mb-0 lg:max-w-none px-6 py-8 lg:px-0 lg:py-0"
                      : "w-full max-w-xl mb-6 lg:mb-0 lg:max-w-none px-6 pt-20 lg:px-0 lg:pt-0"
                  }`}
                >
                  {page.illustrationSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={page.illustrationSrc}
                      alt={page.illustrationAlt || "Illustration"}
                      loading={i === firstImagePageIndex ? "eager" : "lazy"}
                      fetchPriority={i === firstImagePageIndex ? "high" : "low"}
                      decoding="async"
                      onLoad={i === firstImagePageIndex ? () => setFirstImageLoaded(true) : undefined}
                      onError={i === firstImagePageIndex ? () => setFirstImageLoaded(true) : undefined}
                      className={`${
                        mode === "picture-book" ? "rounded-2xl" : "rounded-xl"
                      } w-full object-contain max-h-[60vh] lg:max-h-[85vh]`}
                    />
                  ) : (
                    <div
                      className={`${
                        mode === "picture-book"
                          ? "aspect-[4/3] rounded-2xl"
                          : "aspect-[16/10] rounded-xl"
                      } bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center p-6 text-center`}
                    >
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-stone-400">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                        <p className="text-xs text-stone-400 italic max-w-sm">
                          {page.illustrationAlt || "Illustration"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null;

              const textBlock = (
                <div
                  className={`${hasIll ? "reader-split-text" : ""} reader-tier-${typographyTier} w-full mx-auto ${
                    hasIll ? "px-6 pb-16 lg:px-0 lg:pb-0" : ""
                  }`}
                  style={{
                    color: "var(--reader-text)",
                    fontSize: `calc(1em + ${fontSizeAdjust})`,
                  }}
                >
                  {page.content.split("\n").map((line, li) => {
                    if (!line.trim()) return <div key={li} className="h-2" />;

                    if (aiReadActive && i === currentPage) {
                      let globalWordIndex = 0;
                      const linesAbove = page.content.split("\n").slice(0, li);
                      for (const prevLine of linesAbove) {
                        if (prevLine.trim()) {
                          globalWordIndex += prevLine.trim().split(/\s+/).length;
                        }
                      }
                      const words = line.split(/(\s+)/);
                      let wordIdx = globalWordIndex;
                      return (
                        <p key={li} className="mb-4">
                          {words.map((segment, si) => {
                            if (!segment.trim()) return <span key={si}>{segment}</span>;
                            const thisWordIdx = wordIdx++;
                            return (
                              <span
                                key={si}
                                className={thisWordIdx === highlightedWordIndex ? "word-highlight" : ""}
                              >
                                {segment}
                              </span>
                            );
                          })}
                        </p>
                      );
                    }

                    return (
                      <p key={li} className="mb-4">
                        {line}
                      </p>
                    );
                  })}
                </div>
              );

              // With illustration → side-by-side on desktop via reader-split-layout
              if (hasIll) {
                return (
                  <div className="reader-split-layout">
                    {illustrationBlock}
                    {textBlock}
                  </div>
                );
              }

              // Text-only page — centered, same as before
              return (
                <div
                  className={`w-full h-full flex flex-col ${
                    mode === "picture-book"
                      ? "justify-center items-center px-6 py-12"
                      : "justify-start items-center px-6 pt-20 pb-16"
                  }`}
                >
                  {textBlock}
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      {/* Tap zones — disabled on the completion page so buttons are clickable */}
      {pages[currentPage]?.type !== "completion" && (
        <>
          <div
            className="tap-zone tap-zone-prev"
            onClick={prevPage}
            role="button"
            aria-label="Previous page"
          />
          <div
            className="tap-zone tap-zone-menu"
            onClick={() => {
              setShowUI((prev) => !prev);
              setShowSettings(false);
            }}
            role="button"
            aria-label="Toggle menu"
          />
          <div
            className="tap-zone tap-zone-next"
            onClick={nextPage}
            role="button"
            aria-label="Next page"
          />
        </>
      )}

      {/* Floating navigation hint overlay — shows on first content page */}
      {showNavHint && currentPage === 1 && (
        <div
          className="fixed inset-0 z-40 pointer-events-none flex items-center justify-between px-4"
          style={{ animation: "tapPulse 2s ease-in-out infinite" }}
        >
          {/* Left arrow */}
          <div className="bg-black/10 backdrop-blur-sm rounded-full p-3 pointer-events-auto" onClick={() => { prevPage(); setShowNavHint(false); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </div>

          {/* Right arrow */}
          <div className="bg-black/10 backdrop-blur-sm rounded-full p-3 pointer-events-auto" onClick={() => { nextPage(); setShowNavHint(false); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div
        className="reading-progress"
        style={{ width: `${progress}%` }}
      />

      {/* Bottom page indicator */}
      <div
        className={`fixed bottom-2 left-0 right-0 text-center text-xs opacity-30 transition-opacity duration-300 pointer-events-none ${
          showUI ? "opacity-30" : "opacity-0"
        }`}
        style={{ color: "var(--reader-text)" }}
      >
        {currentPage + 1} of {totalPages}
      </div>
    </div>
  );
}

interface RecommendedBook {
  id: string;
  title: string;
  synopsis: string;
  coverImage: string;
  ageTier: string;
  genre: string[];
}

function MoreBooksToRead({ tier, excludeId }: { tier: string; excludeId: string }) {
  const [books, setBooks] = useState<RecommendedBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`/api/books/more?tier=${tier}&exclude=${excludeId}&limit=4`)
      .then((r) => (r.ok ? r.json() : { books: [] }))
      .then((d) => {
        if (alive) {
          setBooks(d.books || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tier, excludeId]);

  if (loading || books.length === 0) return null;

  return (
    <div
      className="animate-stagger-fade-up mt-12 pt-8 border-t max-w-2xl mx-auto"
      style={{
        borderColor: "color-mix(in srgb, var(--reader-text) 10%, transparent)",
        animationDelay: "0.9s",
        opacity: 0,
      }}
    >
      <h3
        className="text-sm font-bold uppercase tracking-wider mb-5"
        style={{ color: "var(--reader-text-secondary)" }}
      >
        More to Read
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {books.map((b) => (
          <Link
            key={b.id}
            href={`/book/${b.id}`}
            className="group block rounded-xl overflow-hidden bg-stone-100 hover:shadow-lg transition-shadow"
          >
            <div className="aspect-[3/4] overflow-hidden bg-stone-200 relative">
              {b.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.coverImage}
                  alt={b.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                <p className="text-xs font-semibold text-white line-clamp-2 drop-shadow">
                  {b.title}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
