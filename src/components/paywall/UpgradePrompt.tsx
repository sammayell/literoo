"use client";

import Link from "next/link";
import { GuaranteeBadge } from "@/components/shared/GuaranteeBadge";

interface UpgradePromptProps {
  trigger: string; // what the user tried to access
  bookTitle?: string;
  onClose?: () => void;
}

export function UpgradePrompt({ trigger, bookTitle, onClose }: UpgradePromptProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        )}

        <div className="text-4xl mb-4">📚</div>

        <h2 className="text-2xl font-bold text-stone-900 mb-2 font-[family-name:var(--font-lexend)]">
          Unlock Full Access
        </h2>

        <p className="text-stone-600 mb-4 font-[family-name:var(--font-literata)]">
          {bookTitle
            ? `"${bookTitle}" is part of our premium library.`
            : `${trigger} is a premium feature.`}
        </p>

        <div className="space-y-2 text-left mb-6 text-sm text-stone-700">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>1,000+ illustrated stories for all ages</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Quizzes, puzzles &amp; AI read-aloud</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Reading level tracking &amp; parent dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Weekly progress reports</span>
          </div>
        </div>

        <Link
          href="/pricing"
          className="block w-full py-3 px-6 bg-brand-500 text-white rounded-xl font-bold text-lg hover:bg-brand-600 transition-colors mb-3"
        >
          Get Full Access — $99/year
        </Link>

        <p className="text-xs text-stone-400 mb-4">
          Just $8.25/month. Cancel anytime.
        </p>

        <GuaranteeBadge size="sm" />

        {onClose && (
          <button
            onClick={onClose}
            className="block w-full mt-4 text-sm text-stone-400 hover:text-stone-600"
          >
            Maybe later
          </button>
        )}
      </div>
    </div>
  );
}
