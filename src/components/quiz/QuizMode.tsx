"use client";

import { useState, useCallback } from "react";
import type { BookQuiz, QuizQuestion } from "@/lib/types";
import { useProgress } from "@/lib/progress-context";

interface QuizModeProps {
  quiz: BookQuiz;
  bookId: string;
}

export default function QuizMode({ quiz, bookId }: QuizModeProps) {
  const { addQuizResult } = useProgress();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const questions = quiz.questions;
  const total = questions.length;
  const question: QuizQuestion | undefined = questions[currentIndex];
  const progressPercent = ((currentIndex + (answered ? 1 : 0)) / total) * 100;

  const handleSelect = useCallback(
    (choiceIdx: number) => {
      if (answered || !question) return;
      setSelectedIndex(choiceIdx);
      setAnswered(true);
      if (choiceIdx === question.correctIndex) {
        setCorrectCount((c) => c + 1);
      }
    },
    [answered, question]
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= total) {
      // Finished
      const finalScore = correctCount + (selectedIndex === question?.correctIndex ? 0 : 0);
      // correctCount already includes this answer if correct
      setFinished(true);
      addQuizResult(bookId, 0, {
        score: correctCount,
        total,
        completedAt: new Date().toISOString(),
      });
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      setAnswered(false);
    }
  }, [currentIndex, total, correctCount, selectedIndex, question, addQuizResult, bookId]);

  const handleRetake = useCallback(() => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswered(false);
    setCorrectCount(0);
    setFinished(false);
  }, []);

  // --- Results screen ---
  if (finished) {
    const percent = Math.round((correctCount / total) * 100);
    const great = percent >= 80;
    const ok = percent >= 50;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-10 text-center">
        {/* Celebration */}
        <div className="text-6xl mb-4">
          {great ? "🎉" : ok ? "👍" : "📖"}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {great ? "Amazing job!" : ok ? "Good effort!" : "Keep reading!"}
        </h2>
        <p className="text-lg text-gray-600 mb-1">
          You scored{" "}
          <span className="font-bold text-brand-600">
            {correctCount}
          </span>{" "}
          out of{" "}
          <span className="font-bold">{total}</span>
        </p>
        <p className="text-3xl font-extrabold text-brand-500 mb-8">
          {percent}%
        </p>

        {/* Score bar */}
        <div className="w-full max-w-xs h-4 bg-gray-200 rounded-full overflow-hidden mb-8">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${percent}%`,
              backgroundColor: great
                ? "#22c55e"
                : ok
                ? "#ee7a20"
                : "#ef4444",
            }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRetake}
            className="px-6 py-3 rounded-xl border-2 border-brand-500 text-brand-600 font-semibold hover:bg-brand-50 transition-colors"
          >
            Retake Quiz
          </button>
          <a
            href={`/read/${bookId}`}
            className="px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
          >
            Back to Book
          </a>
        </div>
      </div>
    );
  }

  if (!question) return null;

  // --- Question screen ---
  return (
    <div className="flex flex-col min-h-[60vh]">
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question number */}
      <p className="text-sm text-gray-500 mt-4 mb-1 text-center font-medium">
        Question {currentIndex + 1} of {total}
      </p>

      {/* Question text */}
      <h3 className="text-xl font-bold text-gray-900 text-center mb-6 px-4 leading-relaxed">
        {question.question}
      </h3>

      {/* Choices */}
      <div className="flex flex-col gap-3 px-4 mb-6">
        {question.choices.map((choice, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === question.correctIndex;
          let btnClass =
            "w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all duration-200 ";

          if (!answered) {
            btnClass +=
              "border-gray-200 bg-white hover:border-brand-400 hover:bg-brand-50 active:scale-[0.98] cursor-pointer";
          } else if (isCorrect) {
            btnClass +=
              "border-green-500 bg-green-50 text-green-800";
          } else if (isSelected && !isCorrect) {
            btnClass +=
              "border-red-400 bg-red-50 text-red-700";
          } else {
            btnClass += "border-gray-200 bg-gray-50 text-gray-400";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={btnClass}
            >
              <span className="inline-flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{choice}</span>
                {answered && isCorrect && (
                  <span className="ml-auto text-green-600">&#10003;</span>
                )}
                {answered && isSelected && !isCorrect && (
                  <span className="ml-auto text-red-500">&#10007;</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanation + Next */}
      {answered && (
        <div className="px-4 mb-6 animate-[fadeIn_0.3s_ease]">
          <div
            className={`rounded-xl p-4 mb-4 text-sm leading-relaxed ${
              selectedIndex === question.correctIndex
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-amber-50 text-amber-900 border border-amber-200"
            }`}
          >
            <p className="font-semibold mb-1">
              {selectedIndex === question.correctIndex
                ? "Correct!"
                : "Not quite!"}
            </p>
            <p>{question.explanation}</p>
          </div>

          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 active:scale-[0.98] transition-all"
          >
            {currentIndex + 1 >= total ? "See Results" : "Next Question"}
          </button>
        </div>
      )}
    </div>
  );
}
