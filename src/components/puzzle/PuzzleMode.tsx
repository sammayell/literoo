"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { BookPuzzle, PuzzlePage, PuzzleBlank } from "@/lib/types";
import { useProgress } from "@/lib/progress-context";
import { fireConfetti } from "@/lib/confetti";

interface PuzzleModeProps {
  puzzle: BookPuzzle;
  bookId: string;
  pageTexts: string[];
}

interface BlankState {
  filled: boolean;
  correct: boolean;
  selectedWord: string | null;
  shaking: boolean;
}

export default function PuzzleMode({ puzzle, bookId, pageTexts }: PuzzleModeProps) {
  const { addPuzzleResult } = useProgress();
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [blankStates, setBlankStates] = useState<Record<string, BlankState>>({});
  const [activeBlankKey, setActiveBlankKey] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const confettiFired = useRef(false);

  const puzzlePages = puzzle.pages;
  const totalBlanks = useMemo(
    () => puzzlePages.reduce((sum, p) => sum + p.blanks.length, 0),
    [puzzlePages]
  );

  const correctCount = useMemo(
    () => Object.values(blankStates).filter((s) => s.correct).length,
    [blankStates]
  );

  const currentPuzzlePage: PuzzlePage | undefined = puzzlePages[currentPageIdx];
  const progressPercent = totalBlanks > 0 ? (correctCount / totalBlanks) * 100 : 0;

  // Build the display text with blanks
  const renderedContent = useMemo(() => {
    if (!currentPuzzlePage) return null;
    const sourceText = pageTexts[currentPuzzlePage.pageIndex] || "";
    const words = sourceText.split(/\s+/);

    // Collect blank word indices for this page
    const blankMap = new Map<number, PuzzleBlank>();
    for (const blank of currentPuzzlePage.blanks) {
      blankMap.set(blank.wordIndex, blank);
    }

    return words.map((word, idx) => {
      const blank = blankMap.get(idx);
      if (!blank) {
        return { type: "word" as const, text: word, key: `w-${currentPuzzlePage.pageIndex}-${idx}` };
      }
      const blankKey = `${currentPuzzlePage.pageIndex}-${idx}`;
      return {
        type: "blank" as const,
        blank,
        blankKey,
        key: `b-${blankKey}`,
      };
    });
  }, [currentPuzzlePage, pageTexts]);

  const handleBlankTap = useCallback((blankKey: string) => {
    setActiveBlankKey((prev) => (prev === blankKey ? null : blankKey));
  }, []);

  const handleWordChoice = useCallback(
    (blankKey: string, blank: PuzzleBlank, word: string) => {
      const isCorrect = word === blank.correctWord;

      if (isCorrect) {
        setBlankStates((prev) => ({
          ...prev,
          [blankKey]: { filled: true, correct: true, selectedWord: word, shaking: false },
        }));
        setActiveBlankKey(null);
      } else {
        // Shake then reset
        setBlankStates((prev) => ({
          ...prev,
          [blankKey]: { filled: false, correct: false, selectedWord: word, shaking: true },
        }));
        setTimeout(() => {
          setBlankStates((prev) => ({
            ...prev,
            [blankKey]: { ...prev[blankKey], shaking: false, selectedWord: null },
          }));
        }, 500);
      }
    },
    []
  );

  const allPageBlanksCorrect = useMemo(() => {
    if (!currentPuzzlePage) return false;
    return currentPuzzlePage.blanks.every((blank) => {
      const key = `${currentPuzzlePage.pageIndex}-${blank.wordIndex}`;
      return blankStates[key]?.correct;
    });
  }, [currentPuzzlePage, blankStates]);

  const handleNextPage = useCallback(() => {
    if (currentPageIdx + 1 >= puzzlePages.length) {
      setFinished(true);
      addPuzzleResult(bookId, 0, {
        score: correctCount,
        total: totalBlanks,
        completedAt: new Date().toISOString(),
      });
    } else {
      setCurrentPageIdx((i) => i + 1);
      setActiveBlankKey(null);
    }
  }, [currentPageIdx, puzzlePages.length, correctCount, totalBlanks, addPuzzleResult, bookId]);

  const handleRetake = useCallback(() => {
    setCurrentPageIdx(0);
    setBlankStates({});
    setActiveBlankKey(null);
    setFinished(false);
  }, []);

  // Fire confetti on puzzle completion
  useEffect(() => {
    if (finished && !confettiFired.current) {
      confettiFired.current = true;
      const percent = totalBlanks > 0 ? Math.round((correctCount / totalBlanks) * 100) : 0;
      if (percent >= 80) {
        setTimeout(() => fireConfetti(), 200);
      }
    }
  }, [finished, correctCount, totalBlanks]);

  // --- Results screen ---
  if (finished) {
    const percent = totalBlanks > 0 ? Math.round((correctCount / totalBlanks) * 100) : 0;
    const great = percent >= 80;
    const ok = percent >= 50;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-10 text-center">
        <div className="animate-celebrate-in text-6xl mb-4">{great ? "🧩" : ok ? "👍" : "📖"}</div>
        <h2 className="animate-stagger-fade-up text-2xl font-bold text-gray-900 mb-2" style={{ animationDelay: "0.15s", opacity: 0 }}>
          {great ? "Puzzle complete!" : ok ? "Nice work!" : "Keep practicing!"}
        </h2>
        <p className="text-lg text-gray-600 mb-1">
          You filled{" "}
          <span className="font-bold text-brand-600">{correctCount}</span> of{" "}
          <span className="font-bold">{totalBlanks}</span> blanks correctly
        </p>
        <p className="text-3xl font-extrabold text-brand-500 mb-8">{percent}%</p>

        <div className="w-full max-w-xs h-4 bg-gray-200 rounded-full overflow-hidden mb-8">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${percent}%`,
              backgroundColor: great ? "#22c55e" : ok ? "#ee7a20" : "#ef4444",
            }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRetake}
            className="px-6 py-3 rounded-xl border-2 border-brand-500 text-brand-600 font-semibold hover:bg-brand-50 transition-colors"
          >
            Try Again
          </button>
          <a
            href={`/book/${bookId}`}
            className="px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
          >
            Back to Book
          </a>
        </div>
      </div>
    );
  }

  if (!currentPuzzlePage || !renderedContent) return null;

  // --- Puzzle page ---
  return (
    <div className="flex flex-col min-h-[60vh]">
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Page indicator */}
      <p className="text-sm text-gray-500 mt-4 mb-1 text-center font-medium">
        Page {currentPageIdx + 1} of {puzzlePages.length}
      </p>

      <p className="text-xs text-gray-400 text-center mb-4">
        Tap each blank and choose the correct word
      </p>

      {/* Text with blanks */}
      <div className="px-4 mb-6 leading-[2.2] text-lg text-gray-800 relative">
        {renderedContent.map((item) => {
          if (item.type === "word") {
            return (
              <span key={item.key} className="mr-1">
                {item.text}
              </span>
            );
          }

          // Blank
          const state = blankStates[item.blankKey];
          const isActive = activeBlankKey === item.blankKey;
          const isFilled = state?.correct;
          const isShaking = state?.shaking;

          let blankClass = "puzzle-blank";
          if (isFilled) blankClass += " correct";
          if (isShaking) blankClass += " incorrect";

          return (
            <span key={item.key} className="relative inline-block mr-1">
              <span
                className={blankClass}
                onClick={() => !isFilled && handleBlankTap(item.blankKey)}
                role="button"
                tabIndex={0}
                aria-label={isFilled ? `Filled: ${state.selectedWord}` : "Tap to fill blank"}
              >
                {isFilled ? (
                  <span className="inline-flex items-center gap-1">
                    {state.selectedWord}
                    <svg
                      className="w-4 h-4 text-green-600 inline"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="text-gray-400">___</span>
                )}
              </span>

              {/* Word choice popover */}
              {isActive && !isFilled && (
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 flex flex-col bg-white border border-gray-200 rounded-xl shadow-lg p-1 min-w-[140px] animate-[fadeIn_0.15s_ease]">
                  {[item.blank.correctWord, ...item.blank.distractors]
                    .sort(() => Math.random() - 0.5)
                    .map((word) => (
                      <button
                        key={word}
                        onClick={() => handleWordChoice(item.blankKey, item.blank, word)}
                        className="px-4 py-2 text-left rounded-lg hover:bg-brand-50 hover:text-brand-700 text-gray-700 font-medium transition-colors text-sm"
                      >
                        {word}
                      </button>
                    ))}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Next page button */}
      {allPageBlanksCorrect && (
        <div className="px-4 mb-6 animate-[fadeIn_0.3s_ease]">
          <button
            onClick={handleNextPage}
            className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 active:scale-[0.98] transition-all animate-glow-pulse"
          >
            {currentPageIdx + 1 >= puzzlePages.length ? "See Results" : "Next Page"}
          </button>
        </div>
      )}
    </div>
  );
}
