import Link from "next/link";
import { getAllBooks, estimateReadTime, isFreeBook } from "@/lib/books";
import { AGE_TIER_LABELS, AGE_TIER_COLORS, AgeTier } from "@/lib/types";
import { Header } from "@/components/shared/Header";

export default function LibraryPage() {
  const books = getAllBooks();
  const tiers: AgeTier[] = [
    "baby",
    "toddler",
    "early_reader",
    "reader",
    "middle_grade",
    "young_adult",
  ];

  const freeCount = books.filter((b) => isFreeBook(b.id)).length;

  return (
    <div className="min-h-screen">
      <Header currentPage="library" />

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-4 font-[family-name:var(--font-lexend)]">
            Your Library
          </h2>
          <p className="text-lg text-stone-600 mb-8 font-[family-name:var(--font-literata)]">
            {books.length} stories and counting. {freeCount} books are free to
            read right now.
          </p>

          {/* Age tier pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {tiers.map((tier) => {
              const colors = AGE_TIER_COLORS[tier];
              const count = books.filter((b) => b.ageTier === tier).length;
              return (
                <a
                  key={tier}
                  href={`#${tier}`}
                  className={`${colors.bg} ${colors.text} px-4 py-2 rounded-full text-sm font-semibold transition-transform hover:scale-105`}
                >
                  {AGE_TIER_LABELS[tier]} ({count})
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Book grid by tier */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {tiers.map((tier) => {
          const tierBooks = books.filter((b) => b.ageTier === tier);
          if (tierBooks.length === 0) return null;
          const colors = AGE_TIER_COLORS[tier];

          return (
            <section key={tier} id={tier} className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <span
                  className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}
                >
                  {AGE_TIER_LABELS[tier]}
                </span>
                <div className="h-px bg-stone-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tierBooks.map((book) => {
                  const free = isFreeBook(book.id);
                  return (
                    <Link
                      key={book.id}
                      href={`/book/${book.id}`}
                      className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg hover:border-brand-300 transition-all duration-200 relative"
                    >
                      {/* Free / Lock badge */}
                      <div className="absolute top-3 right-3 z-10">
                        {free ? (
                          <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                            Free
                          </span>
                        ) : (
                          <span className="bg-stone-800/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Pro
                          </span>
                        )}
                      </div>

                      {/* Cover placeholder */}
                      <div
                        className={`h-48 ${colors.bg} flex items-center justify-center relative overflow-hidden`}
                      >
                        <div className="text-center p-6">
                          <h3 className="text-xl font-bold text-stone-800 font-[family-name:var(--font-literata)] group-hover:text-brand-600 transition-colors">
                            {book.title}
                          </h3>
                        </div>
                        <div
                          className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-20 ${
                            tier === "young_adult"
                              ? "bg-teal-400"
                              : "bg-stone-800"
                          }`}
                        />
                      </div>

                      {/* Card body */}
                      <div className="p-5">
                        <p className="text-sm text-stone-600 line-clamp-2 mb-3 font-[family-name:var(--font-literata)]">
                          {book.synopsis}
                        </p>

                        <div className="flex items-center justify-between text-xs text-stone-400">
                          <span>{book.wordCount.toLocaleString()} words</span>
                          <span>
                            {estimateReadTime(book.wordCount)} min read
                          </span>
                          <span>{book.chapters.length} ch.</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-3">
                          {book.genre.slice(0, 3).map((g) => (
                            <span
                              key={g}
                              className="bg-stone-100 text-stone-500 px-2 py-0.5 rounded-md text-xs"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

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
