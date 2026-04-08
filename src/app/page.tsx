"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ageToTier, setChildInfo } from "@/lib/subscription";
import { startChallenge } from "@/lib/challenge";
import { GuaranteeBadge } from "@/components/shared/GuaranteeBadge";
import { Header } from "@/components/shared/Header";

export default function ChallengeLandingPage() {
  const router = useRouter();
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!childName.trim() || childAge === "") return;
    setSubmitting(true);

    const age = Number(childAge);
    const tier = ageToTier(age);
    setChildInfo(childName.trim(), age);
    startChallenge(childName.trim(), age, tier);
    router.push("/challenge");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-orange-50/30 to-white">
      <Header />

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6 font-[family-name:var(--font-lexend)] leading-tight">
            Your child can read{" "}
            <span className="text-brand-500">5 books</span> in{" "}
            <span className="text-brand-500">5 days</span>
          </h2>
          <p className="text-lg sm:text-xl text-stone-600 mb-10 font-[family-name:var(--font-literata)]">
            Free 5-day reading challenge matched to your child&apos;s age
          </p>

          {/* Signup form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 sm:p-8 max-w-md mx-auto"
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="childName"
                  className="block text-sm font-semibold text-stone-700 mb-1 text-left"
                >
                  Child&apos;s First Name
                </label>
                <input
                  id="childName"
                  type="text"
                  placeholder="e.g. Emma"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-base"
                />
              </div>
              <div>
                <label
                  htmlFor="childAge"
                  className="block text-sm font-semibold text-stone-700 mb-1 text-left"
                >
                  Age
                </label>
                <select
                  id="childAge"
                  value={childAge}
                  onChange={(e) =>
                    setChildAge(e.target.value ? Number(e.target.value) : "")
                  }
                  required
                  className="w-full px-4 py-3 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-base bg-white"
                >
                  <option value="">Select age</option>
                  {Array.from({ length: 18 }, (_, i) => i + 1).map((age) => (
                    <option key={age} value={age}>
                      {age} {age === 1 ? "year old" : "years old"}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting || !childName.trim() || childAge === ""}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-6 rounded-xl text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-lexend)]"
              >
                {submitting ? "Starting..." : "Start the Challenge"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 text-center mb-12 font-[family-name:var(--font-lexend)]">
            How It Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Tell us their age",
                desc: "We match books to your child's reading level automatically.",
                icon: "🎯",
              },
              {
                step: "2",
                title: "Read one book per day",
                desc: "Short, engaging illustrated stories they'll love.",
                icon: "📖",
              },
              {
                step: "3",
                title: "See their progress",
                desc: "Track words read, time spent, and reading level growth.",
                icon: "📊",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">
                  Step {item.step}
                </div>
                <h4 className="text-lg font-bold text-stone-900 mb-2 font-[family-name:var(--font-lexend)]">
                  {item.title}
                </h4>
                <p className="text-sm text-stone-600 font-[family-name:var(--font-literata)]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="py-12 px-4">
        <div className="max-w-md mx-auto">
          <GuaranteeBadge size="lg" />
        </div>
      </section>

      {/* Bottom links */}
      <section className="py-12 px-4 text-center space-y-4">
        <div>
          <Link
            href="/library"
            className="text-brand-600 hover:text-brand-700 font-semibold underline underline-offset-2"
          >
            Already a member? Go to Library
          </Link>
        </div>
        <div>
          <Link
            href="/pricing"
            className="text-stone-500 hover:text-stone-700 text-sm underline underline-offset-2"
          >
            View Pricing
          </Link>
        </div>
      </section>

      <footer className="bg-stone-900 text-stone-400 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm">
          <p>
            Literoo by ChillPlayVibe. AI-crafted stories, educator-reviewed.
          </p>
        </div>
      </footer>
    </div>
  );
}
