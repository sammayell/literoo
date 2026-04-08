"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isSubscribed } from "@/lib/subscription";
import { useAuth, isActiveSubscriber } from "@/lib/auth-context";
import { GuaranteeBadge } from "@/components/shared/GuaranteeBadge";

const VALUE_STACK = [
  { item: "1,000+ illustrated books", value: "$200" },
  { item: "Quizzes & comprehension tests", value: "$100" },
  { item: "AI read-aloud narration", value: "$80" },
  { item: "Vocabulary puzzles", value: "$60" },
  { item: "Reading level assessment", value: "$150" },
  { item: "90-day personalized reading plan", value: "$200" },
  { item: "Weekly progress reports", value: "$50" },
];

const FAQ = [
  {
    q: "What ages is this for?",
    a: "Literoo works for children ages 1 through 18. We have books ranging from peek-a-boo board books for babies to young adult novels for teens. Every book is matched to your child's reading level.",
  },
  {
    q: "How is this different from Epic!?",
    a: "Literoo uses AI-powered personalization to match books precisely to your child's level. Plus we include comprehension quizzes, vocabulary puzzles, and detailed progress tracking that other platforms charge extra for.",
  },
  {
    q: "What if my child doesn't like it?",
    a: "We offer a 90-day Reader Guarantee. If your child doesn't improve their reading in 90 days, we'll refund every penny and give you $20 for your time. No questions asked.",
  },
  {
    q: "Can I use it on multiple devices?",
    a: "Yes! Literoo works on any device with a web browser. Your child can read on an iPad at home, a Chromebook at school, or your phone in the car.",
  },
  {
    q: "Is there a monthly option?",
    a: "We only offer annual subscriptions at $99/year ($8.25/month). This gives families the best value and ensures children have enough time to build real reading habits.",
  },
  {
    q: "How do I cancel?",
    a: "Email us anytime at support@literoo.com and we'll cancel your subscription immediately. No hoops, no retention calls.",
  },
];

export default function PricingPage() {
  const [subscribed, setSubscribedState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSubscribedState(isSubscribed());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="text-stone-400">Loading...</div>
      </div>
    );
  }

  if (subscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-stone-900 mb-4 font-[family-name:var(--font-lexend)]">
            You&apos;re a Member!
          </h1>
          <p className="text-stone-600 mb-8 font-[family-name:var(--font-literata)]">
            You have full access to the entire Literoo library.
          </p>
          <Link
            href="/library"
            className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-xl text-lg transition-colors font-[family-name:var(--font-lexend)]"
          >
            Go to Library
          </Link>
        </div>
      </div>
    );
  }

  const totalValue = VALUE_STACK.reduce(
    (sum, item) => sum + parseInt(item.value.replace("$", "")),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-brand-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold text-stone-900 font-[family-name:var(--font-lexend)]">
                Literoo
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/library"
                className="text-sm text-stone-500 hover:text-brand-600 transition-colors"
              >
                Library
              </Link>
              <Link
                href="/challenge"
                className="text-sm text-stone-500 hover:text-brand-600 transition-colors"
              >
                Challenge
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Headline */}
      <section className="pt-16 pb-8 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-4 font-[family-name:var(--font-lexend)] leading-tight">
          Give Your Child the{" "}
          <span className="text-brand-500">Gift of Reading</span>
        </h1>
        <p className="text-lg text-stone-600 max-w-xl mx-auto font-[family-name:var(--font-literata)]">
          Everything your child needs to become a confident, lifelong reader.
        </p>
      </section>

      {/* Value stack */}
      <section className="max-w-lg mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden">
          <div className="bg-stone-900 text-white px-6 py-4">
            <h2 className="font-bold text-lg font-[family-name:var(--font-lexend)]">
              What You Get
            </h2>
          </div>
          <div className="divide-y divide-stone-100">
            {VALUE_STACK.map((row) => (
              <div
                key={row.item}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-stone-700 font-[family-name:var(--font-literata)]">
                    {row.item}
                  </span>
                </div>
                <span className="text-stone-400 line-through text-sm font-semibold ml-4 flex-shrink-0">
                  {row.value}/yr
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-t border-stone-200">
            <span className="font-bold text-stone-900 font-[family-name:var(--font-lexend)]">
              Total Value
            </span>
            <span className="text-stone-400 line-through text-lg font-bold">
              ${totalValue}+/yr
            </span>
          </div>
        </div>
      </section>

      {/* Price reveal */}
      <section className="text-center px-4 pb-12">
        <p className="text-stone-500 text-sm uppercase tracking-wider font-semibold mb-2">
          Your Price
        </p>
        <div className="text-5xl sm:text-6xl font-bold text-brand-500 mb-1 font-[family-name:var(--font-lexend)]">
          $99<span className="text-2xl text-stone-400">/year</span>
        </div>
        <p className="text-stone-500 text-sm mb-8">
          That&apos;s just <strong>$8.25/month</strong>
        </p>

        <button
          onClick={async () => {
            const res = await fetch("/api/stripe/checkout", { method: "POST" });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else if (data.error === "Not authenticated") window.location.href = "/auth/signup?next=/pricing";
          }}
          className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 px-10 rounded-xl text-xl transition-colors shadow-lg shadow-brand-200 font-[family-name:var(--font-lexend)] cursor-pointer"
        >
          Start Reading Today
        </button>
        <p className="text-xs text-stone-400 mt-3">
          Secure payment via Stripe. Cancel anytime.
        </p>
      </section>

      {/* Guarantee */}
      <section className="max-w-md mx-auto px-4 pb-16">
        <GuaranteeBadge size="lg" />
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-stone-900 text-center mb-8 font-[family-name:var(--font-lexend)]">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQ.map((faq) => (
            <details
              key={faq.q}
              className="bg-white rounded-xl border border-stone-200 group"
            >
              <summary className="px-6 py-4 cursor-pointer text-stone-900 font-semibold font-[family-name:var(--font-lexend)] list-none flex items-center justify-between">
                <span>{faq.q}</span>
                <svg
                  className="w-5 h-5 text-stone-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="px-6 pb-4 text-stone-600 text-sm font-[family-name:var(--font-literata)] leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm space-y-3">
          <p>
            Literoo by ChillPlayVibe. AI-crafted stories, educator-reviewed.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/library"
              className="hover:text-stone-200 transition-colors"
            >
              Library
            </Link>
            <Link
              href="/challenge"
              className="hover:text-stone-200 transition-colors"
            >
              Challenge
            </Link>
            <Link href="/" className="hover:text-stone-200 transition-colors">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
