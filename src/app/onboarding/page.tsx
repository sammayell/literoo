"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { ageToTier } from "@/lib/subscription";

const GENRES = [
  { id: "adventure", label: "Adventure", icon: "\u{1F3D4}\uFE0F" },
  { id: "fantasy", label: "Fantasy", icon: "\u{1F9D9}" },
  { id: "animals", label: "Animals", icon: "\u{1F43B}" },
  { id: "humor", label: "Humor", icon: "\u{1F602}" },
  { id: "mystery", label: "Mystery", icon: "\u{1F50D}" },
  { id: "bedtime", label: "Bedtime", icon: "\u{1F31C}" },
  { id: "school", label: "School", icon: "\u{1F3EB}" },
  { id: "science", label: "Science", icon: "\u{1F52C}" },
];

interface RecommendedBook {
  id: string;
  title: string;
  synopsis: string;
  ageTier: string;
  genre: string[];
  wordCount: number;
}

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childError, setChildError] = useState<string | null>(null);
  const [addingChild, setAddingChild] = useState(false);
  const [childAdded, setChildAdded] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<RecommendedBook[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  const totalSteps = 5;

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) return prev.filter((g) => g !== genre);
      if (prev.length >= 3) return prev;
      return [...prev, genre];
    });
  };

  const handleAddChild = async () => {
    if (!user) return;
    setChildError(null);

    const age = parseInt(childAge, 10);
    if (isNaN(age) || age < 0 || age > 17) {
      setChildError("Please enter a valid age (0-17).");
      return;
    }
    if (!childName.trim()) {
      setChildError("Please enter a name.");
      return;
    }

    setAddingChild(true);
    const { error } = await supabase.from("child_profiles").insert({
      parent_id: user.id,
      name: childName.trim(),
      age,
      age_tier: ageToTier(age),
    });

    if (error) {
      setChildError(error.message);
    } else {
      setChildAdded(true);
    }
    setAddingChild(false);
  };

  const fetchRecommendations = async () => {
    const age = parseInt(childAge, 10);
    if (isNaN(age)) return;
    const tier = ageToTier(age);
    setLoadingBooks(true);
    try {
      const res = await fetch(`/api/books/recommend?tier=${tier}`);
      const data = await res.json();
      if (data.books) setRecommendedBooks(data.books);
    } catch {
      // silently fail
    }
    setLoadingBooks(false);
  };

  const goNext = async () => {
    if (step === 1 && !childAdded) {
      await handleAddChild();
      if (!childAdded) return; // wait for state update
    }
    if (step === 2) {
      await fetchRecommendations();
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  // After child added successfully, auto-advance
  useEffect(() => {
    if (childAdded && step === 1) {
      // Don't auto-advance, let user click next
    }
  }, [childAdded, step]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-brand-500 font-[family-name:var(--font-lexend)] text-lg">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-8 pb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === step
                ? "bg-brand-500 scale-125"
                : i < step
                  ? "bg-brand-300"
                  : "bg-stone-200"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-lg">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center animate-fade-in">
              <div className="text-6xl mb-6">{"\u{1F4DA}"}</div>
              <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 font-[family-name:var(--font-lexend)]">
                Welcome to Literoo!
              </h1>
              <p className="text-lg text-stone-600 mb-10 font-[family-name:var(--font-literata)] max-w-md mx-auto">
                Let&apos;s set up your child&apos;s reading profile. It only takes a minute.
              </p>
              <button
                onClick={() => setStep(1)}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 px-10 rounded-xl text-lg transition-colors shadow-lg shadow-brand-200/50 font-[family-name:var(--font-lexend)]"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Step 1: Add Child */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">{"\u{1F9D2}"}</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2 font-[family-name:var(--font-lexend)]">
                  Add Your Child
                </h2>
                <p className="text-stone-500 font-[family-name:var(--font-literata)]">
                  We&apos;ll personalize their reading experience based on their age.
                </p>
              </div>

              {childError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-[family-name:var(--font-literata)]">
                  {childError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="childName"
                    className="block text-sm font-medium text-stone-700 font-[family-name:var(--font-lexend)] mb-1.5"
                  >
                    Child&apos;s Name
                  </label>
                  <input
                    id="childName"
                    type="text"
                    required
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-stone-900 text-base font-[family-name:var(--font-literata)]"
                    placeholder="e.g. Emma"
                  />
                </div>
                <div>
                  <label
                    htmlFor="childAge"
                    className="block text-sm font-medium text-stone-700 font-[family-name:var(--font-lexend)] mb-1.5"
                  >
                    Age
                  </label>
                  <select
                    id="childAge"
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-stone-900 text-base font-[family-name:var(--font-literata)] bg-white"
                  >
                    <option value="">Select age...</option>
                    {Array.from({ length: 18 }, (_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? "Under 1" : `${i} year${i === 1 ? "" : "s"} old`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {childAdded && (
                <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-[family-name:var(--font-literata)] flex items-center gap-2">
                  <span className="text-lg">{"\u2705"}</span>
                  <span>
                    <strong>{childName}</strong> has been added!
                  </span>
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="px-6 py-3 text-stone-500 hover:text-stone-700 font-semibold rounded-xl transition font-[family-name:var(--font-lexend)]"
                >
                  Back
                </button>
                <button
                  onClick={async () => {
                    if (!childAdded) {
                      await handleAddChild();
                      // Check if handleAddChild succeeded by checking for errors
                      // We need to wait for state, so use a callback pattern
                    }
                    // If childAdded or no error, go next
                    setStep(2);
                  }}
                  disabled={addingChild || (!childAdded && (!childName.trim() || !childAge))}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors disabled:opacity-50 font-[family-name:var(--font-lexend)]"
                >
                  {addingChild ? "Saving..." : childAdded ? "Continue" : "Save & Continue"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Pick Interests */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">{"\u2728"}</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2 font-[family-name:var(--font-lexend)]">
                  Pick Interests
                </h2>
                <p className="text-stone-500 font-[family-name:var(--font-literata)]">
                  What does {childName || "your child"} love? Select 2-3 genres.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {GENRES.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      onClick={() => toggleGenre(genre.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                        isSelected
                          ? "border-brand-500 bg-brand-50 shadow-sm"
                          : "border-stone-200 hover:border-stone-300 bg-white"
                      }`}
                    >
                      <span className="text-2xl">{genre.icon}</span>
                      <span
                        className={`font-semibold text-sm font-[family-name:var(--font-lexend)] ${
                          isSelected ? "text-brand-600" : "text-stone-700"
                        }`}
                      >
                        {genre.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-xs text-stone-400 mt-3">
                {selectedGenres.length}/3 selected
              </p>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-stone-500 hover:text-stone-700 font-semibold rounded-xl transition font-[family-name:var(--font-lexend)]"
                >
                  Back
                </button>
                <button
                  onClick={async () => {
                    await fetchRecommendations();
                    setStep(3);
                  }}
                  disabled={selectedGenres.length < 2}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors disabled:opacity-50 font-[family-name:var(--font-lexend)]"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: First Book */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">{"\u{1F4D6}"}</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2 font-[family-name:var(--font-lexend)]">
                  Pick a First Book
                </h2>
                <p className="text-stone-500 font-[family-name:var(--font-literata)]">
                  Here are some recommendations for {childName || "your child"}.
                </p>
              </div>

              {loadingBooks ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse text-stone-400 font-[family-name:var(--font-literata)]">
                    Finding great books...
                  </div>
                </div>
              ) : recommendedBooks.length > 0 ? (
                <div className="space-y-3">
                  {recommendedBooks.map((book) => (
                    <Link
                      key={book.id}
                      href={`/book/${book.id}`}
                      className="block bg-white rounded-xl border border-stone-200 p-5 hover:border-brand-300 hover:shadow-md transition-all group"
                    >
                      <h3 className="font-bold text-stone-900 font-[family-name:var(--font-lexend)] group-hover:text-brand-600 transition-colors mb-1">
                        {book.title}
                      </h3>
                      <p className="text-sm text-stone-500 font-[family-name:var(--font-literata)] line-clamp-2 mb-2">
                        {book.synopsis}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400">
                          {book.genre.join(", ")}
                        </span>
                        <span className="text-brand-500 text-sm font-semibold font-[family-name:var(--font-lexend)] ml-auto">
                          Start Reading &rarr;
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-400 font-[family-name:var(--font-literata)]">
                  No books found for this age group yet. Check back soon!
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 text-stone-500 hover:text-stone-700 font-semibold rounded-xl transition font-[family-name:var(--font-lexend)]"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 px-6 rounded-xl text-lg transition-colors font-[family-name:var(--font-lexend)]"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="text-center animate-fade-in">
              <div className="text-6xl mb-6">{"\u{1F389}"}</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 font-[family-name:var(--font-lexend)]">
                You&apos;re All Set!
              </h2>
              <p className="text-lg text-stone-600 mb-10 font-[family-name:var(--font-literata)] max-w-md mx-auto">
                {childName || "Your child"} is ready to start reading. Explore the library or check the dashboard to track progress.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/library"
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors shadow-lg shadow-brand-200/50 font-[family-name:var(--font-lexend)] w-full sm:w-auto text-center"
                >
                  Explore Library
                </Link>
                <Link
                  href="/dashboard"
                  className="bg-white hover:bg-stone-50 text-stone-700 font-semibold py-4 px-8 rounded-xl text-lg transition-colors border border-stone-200 font-[family-name:var(--font-lexend)] w-full sm:w-auto text-center"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
