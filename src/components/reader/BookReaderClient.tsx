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
  const scrollRef = useRef<HTMLDivElement>(null);
  const readingTimerRef = useRef<number>(0);

  // Paywall check — DISABLED for free launch (all books free)
  useEffect(() => {
    // if (!isFree && !isSubscribed() && !isChallengeBook(book.id)) {
    //   setShowPaywall(true);
    // }
    setHasCheckedAccess(true);
  }, [isFree, book.id]);

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

  // AI Read mode — TTS controls
  const startAIRead = useCallback(() => {
    const tts = getTTS();
    if (!tts.isSupported) return;

    const page = pages[currentPage];
    if (!page || page.type !== "text") return;

    tts.setRate(ttsSpeed);
    tts.onBoundary((event) => {
      setHighlightedWordIndex(event.wordIndex);
    });
    tts.onEnd(() => {
      setHighlightedWordIndex(-1);
      // Auto-advance to next page
      if (currentPage < pages.length - 1) {
        setTimeout(() => {
          goToPage(currentPage + 1);
          // Continue reading on next page after a brief pause
          setTimeout(() => {
            if (aiReadActive) startAIRead();
          }, 500);
        }, 300);
      } else {
        setAiReadActive(false);
      }
    });

    tts.speak(page.content);
    setAiReadActive(true);
  }, [currentPage, pages, ttsSpeed, aiReadActive]);

  const stopAIRead = useCallback(() => {
    const tts = getTTS();
    tts.stop();
    setAiReadActive(false);
    setHighlightedWordIndex(-1);
  }, []);

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

  return (
    <div
      data-reader-theme={applyTheme}
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{
        backgroundColor: "var(--reader-bg, #ffffff)",
        color: "var(--reader-text, #1a1a1a)",
      }}
    >
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

          {/* AI Read button */}
          <button
            onClick={toggleAIRead}
            className={`p-2 rounded-lg transition-colors ${
              aiReadActive
                ? "bg-brand-500 text-white"
                : "hover:bg-black/5 dark:hover:bg-white/10"
            }`}
            aria-label={aiReadActive ? "Stop reading" : "Read to me"}
            title={aiReadActive ? "Stop reading" : "Read to me"}
          >
            {aiReadActive ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

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

      {/* AI Read floating controls */}
      {aiReadActive && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full shadow-xl backdrop-blur-md transition-all`}
          style={{
            backgroundColor:
              applyTheme === "dark"
                ? "rgba(30,30,30,0.95)"
                : "rgba(255,255,255,0.95)",
          }}
        >
          <button
            onClick={stopAIRead}
            className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
            aria-label="Stop reading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
          <span className="text-xs font-medium opacity-60">
            Reading aloud... {ttsSpeed}x
          </span>
        </div>
      )}

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
              // Completion page with quiz/puzzle CTAs
              // Completion page with quiz/puzzle CTAs + challenge tracking
              <div className="text-center max-w-md mx-auto px-8">
                <div className="text-5xl mb-6">
                  {book.ageTier === "baby" || book.ageTier === "toddler" ? "🌟" : "🎉"}
                </div>
                <h2
                  className="text-3xl font-bold mb-3 font-[family-name:var(--font-literata)]"
                  style={{ color: "var(--reader-text)" }}
                >
                  The End
                </h2>
                <p className="text-sm opacity-50 mb-8">
                  Great job reading {book.title}!
                </p>

                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  {book.quiz && (
                    <button
                      onClick={() => setReaderMode("quiz")}
                      className="w-full py-3 px-6 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
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
                      className="w-full py-3 px-6 bg-purple-500 text-white rounded-xl font-semibold text-sm hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                    >
                      Try the Word Puzzle!
                    </button>
                  )}

                  {/* Challenge tracking */}
                  {isChallengeBook(book.id) && (
                    <Link
                      href="/challenge"
                      className="w-full py-3 px-6 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors text-center"
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
                    className="w-full py-3 px-6 bg-stone-200 text-stone-700 rounded-xl font-semibold text-sm hover:bg-stone-300 transition-colors text-center"
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
              </div>
            ) : (
              // Content page
              <div
                className={`w-full h-full flex flex-col ${
                  mode === "picture-book"
                    ? "justify-center items-center px-6 py-12"
                    : "justify-start items-center overflow-y-auto px-6 pt-20 pb-16"
                }`}
              >
                {/* Illustration — real image if src exists, placeholder if not */}
                {(page.illustrationSrc || page.illustrationDesc) && (
                  <div
                    className={`${
                      mode === "picture-book"
                        ? "w-full max-w-2xl mb-6"
                        : "w-full max-w-xl mb-6"
                    }`}
                  >
                    {page.illustrationSrc ? (
                      <img
                        src={page.illustrationSrc}
                        alt={page.illustrationAlt || "Illustration"}
                        className={`${
                          mode === "picture-book"
                            ? "rounded-2xl"
                            : "rounded-xl"
                        } w-full object-contain max-h-[60vh]`}
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
                )}

                {/* Text content — with optional word highlighting for AI Read */}
                <div
                  className={`reader-tier-${typographyTier} w-full mx-auto`}
                  style={{
                    color: "var(--reader-text)",
                    fontSize: `calc(1em + ${fontSizeAdjust})`,
                  }}
                >
                  {page.content.split("\n").map((line, li) => {
                    if (!line.trim()) return <div key={li} className="h-2" />;

                    // When AI Read is active, wrap each word in a span for highlighting
                    if (aiReadActive && i === currentPage) {
                      let globalWordIndex = 0;
                      // Calculate word offset for this line within the full page text
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
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tap zones */}
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
