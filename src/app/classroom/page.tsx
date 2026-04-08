"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/shared/Header";

export default function ClassroomPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    teacherName: "",
    school: "",
    email: "",
    gradeLevels: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("literoo_classroom_signup", JSON.stringify(form));
      } catch {
        // Storage unavailable
      }
    }
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header currentPage="classroom" />

      {/* Hero */}
      <section className="pt-20 pb-12 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            100% Free for Schools
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-6 font-[family-name:var(--font-lexend)] leading-tight">
            Literoo is{" "}
            <span className="text-blue-600">Free for Classrooms</span>
          </h1>
          <p className="text-lg text-stone-600 max-w-xl mx-auto font-[family-name:var(--font-literata)]">
            Give every student access to age-appropriate books, quizzes, and
            reading tools at no cost to your school.
          </p>
        </div>
      </section>

      {/* 3 steps */}
      <section className="pb-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Sign up your class",
              desc: "Fill out the form below with your school info. We'll set up your classroom in minutes.",
              icon: "🏫",
            },
            {
              step: "2",
              title: "Students read at school",
              desc: "Students access Literoo on any device during reading time. No app install needed.",
              icon: "📚",
            },
            {
              step: "3",
              title: "Parents subscribe for home",
              desc: "Parents can optionally subscribe for unlimited home reading at $99/year.",
              icon: "🏠",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                {item.icon}
              </div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                Step {item.step}
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2 font-[family-name:var(--font-lexend)]">
                {item.title}
              </h3>
              <p className="text-sm text-stone-600 font-[family-name:var(--font-literata)]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Signup form */}
      <section className="pb-16 px-4">
        <div className="max-w-md mx-auto">
          {submitted ? (
            <div className="bg-white rounded-2xl border-2 border-green-200 p-8 text-center shadow-lg">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-stone-900 mb-3 font-[family-name:var(--font-lexend)]">
                Thank You!
              </h2>
              <p className="text-stone-600 mb-6 font-[family-name:var(--font-literata)]">
                We&apos;ll be in touch shortly to set up your classroom.
              </p>
              <Link
                href="/library"
                className="text-brand-600 hover:text-brand-700 font-semibold underline underline-offset-2"
              >
                Browse the Library
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-lg"
            >
              <h2 className="text-xl font-bold text-stone-900 mb-6 font-[family-name:var(--font-lexend)] text-center">
                Sign Up Your Classroom
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="teacherName"
                    className="block text-sm font-semibold text-stone-700 mb-1"
                  >
                    Your Name
                  </label>
                  <input
                    id="teacherName"
                    type="text"
                    placeholder="Ms. Johnson"
                    value={form.teacherName}
                    onChange={(e) =>
                      setForm({ ...form, teacherName: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="school"
                    className="block text-sm font-semibold text-stone-700 mb-1"
                  >
                    School Name
                  </label>
                  <input
                    id="school"
                    type="text"
                    placeholder="Lincoln Elementary"
                    value={form.school}
                    onChange={(e) =>
                      setForm({ ...form, school: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-stone-700 mb-1"
                  >
                    School Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="mjohnson@school.edu"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="gradeLevels"
                    className="block text-sm font-semibold text-stone-700 mb-1"
                  >
                    Grade Levels
                  </label>
                  <input
                    id="gradeLevels"
                    type="text"
                    placeholder="e.g. K-3, 4-6"
                    value={form.gradeLevels}
                    onChange={(e) =>
                      setForm({ ...form, gradeLevels: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl text-lg transition-colors font-[family-name:var(--font-lexend)]"
                >
                  Get Started Free
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="pb-16 px-4">
        <div className="max-w-3xl mx-auto bg-stone-900 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-2 font-[family-name:var(--font-lexend)]">
            1,000+
          </h2>
          <p className="text-stone-400 text-lg font-[family-name:var(--font-literata)]">
            Books across all reading levels, from baby board books to young
            adult novels. Every book includes quizzes and vocabulary activities.
          </p>
        </div>
      </section>

      {/* Parent CTA */}
      <section className="pb-16 px-4 text-center">
        <p className="text-stone-600 mb-3 font-[family-name:var(--font-literata)]">
          Are you a parent looking for home access?
        </p>
        <Link
          href="/pricing"
          className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-xl transition-colors font-[family-name:var(--font-lexend)]"
        >
          View Parent Pricing
        </Link>
      </section>

      {/* Footer */}
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
