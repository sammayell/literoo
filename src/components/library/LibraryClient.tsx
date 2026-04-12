"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { Book } from "@/lib/types";
import { AGE_TIER_LABELS, AGE_TIER_COLORS, AgeTier } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

const ADMIN_EMAILS = ["sam@sammayell.com", "hello@chillplayvibe.com"];

interface LibraryClientProps {
  books: Book[];
  freeBookIds: string[];
}

const TIERS: AgeTier[] = [
  "baby",
  "toddler",
  "early_reader",
  "reader",
  "middle_grade",
  "young_adult",
];

const TIER_EMOJI: Record<AgeTier, string> = {
  baby: "🌙",
  toddler: "🌈",
  early_reader: "🐉",
  reader: "🔍",
  middle_grade: "🎮",
  young_adult: "⚡",
};

function estimateReadTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 150));
}

export default function LibraryClient({ books, freeBookIds: freeBookIdsArray }: LibraryClientProps) {
  const freeBookIds = useMemo(() => new Set(freeBookIdsArray), [freeBookIdsArray]);
  const [search, setSearch] = useState("");
  const [activeTiers, setActiveTiers] = useState<Set<AgeTier>>(new Set());
  const [activeGenres, setActiveGenres] = useState<Set<string>>(new Set());

  // Admin: hide/unhide books
  const { user } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);

  // Load hidden book IDs for admins
  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/hide-book")
      .then((r) => r.json())
      .then((d) => setHiddenIds(new Set(d.hidden || [])))
      .catch(() => {});
  }, [isAdmin]);

  const toggleHideBook = useCallback(async (bookId: string, hide: boolean) => {
    const res = await fetch("/api/admin/hide-book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, action: hide ? "hide" : "unhide" }),
    });
    if (res.ok) {
      const data = await res.json();
      setHiddenIds(new Set(data.hidden));
    }
  }, []);

  // Compute top 10 genres from all books
  const topGenres = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => b.genre.forEach((g) => {
      counts[g] = (counts[g] || 0) + 1;
    }));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([genre]) => genre);
  }, [books]);

  const hasFilters = search.length > 0 || activeTiers.size > 0 || activeGenres.size > 0;

  // Filter books
  const filteredBooks = useMemo(() => {
    let result = books;

    if (search.length > 0) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.synopsis.toLowerCase().includes(q)
      );
    }

    if (activeTiers.size > 0) {
      result = result.filter((b) => activeTiers.has(b.ageTier));
    }

    if (activeGenres.size > 0) {
      result = result.filter((b) =>
        b.genre.some((g) => activeGenres.has(g))
      );
    }

    return result;
  }, [books, search, activeTiers, activeGenres]);

  const toggleTier = (tier: AgeTier) => {
    setActiveTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  const toggleGenre = (genre: string) => {
    setActiveGenres((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) next.delete(genre);
      else next.add(genre);
      return next;
    });
  };

  const clearAll = () => {
    setSearch("");
    setActiveTiers(new Set());
    setActiveGenres(new Set());
  };

  const isSearchActive = search.length > 0;

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-4 font-[family-name:var(--font-lexend)]">
            Your Library
          </h2>
          <p className="text-lg text-stone-600 mb-8 font-[family-name:var(--font-literata)]">
            {books.length} stories and counting. All free during launch.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto mb-6">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or synopsis..."
              className="w-full pl-12 pr-10 py-3 rounded-full border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-base font-[family-name:var(--font-literata)]"
            />
            {search.length > 0 && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Age tier filter pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {TIERS.map((tier) => {
              const colors = AGE_TIER_COLORS[tier];
              const count = books.filter((b) => b.ageTier === tier).length;
              const isActive = activeTiers.has(tier);
              return (
                <button
                  key={tier}
                  onClick={() => toggleTier(tier)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isActive
                      ? "ring-2 ring-brand-500 ring-offset-2 scale-105"
                      : "hover:scale-105"
                  } ${colors.bg} ${colors.text}`}
                >
                  {TIER_EMOJI[tier]} {AGE_TIER_LABELS[tier]} ({count})
                </button>
              );
            })}
          </div>

          {/* Genre filter pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {topGenres.map((genre) => {
              const isActive = activeGenres.has(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-brand-500 text-white ring-2 ring-brand-300 ring-offset-1"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>

          {/* Clear all + result count */}
          <div className="flex items-center justify-center gap-4 text-sm text-stone-500">
            <span className="font-[family-name:var(--font-literata)]">
              Showing {filteredBooks.length} of {books.length} books
            </span>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="text-brand-500 hover:text-brand-700 font-semibold underline underline-offset-2"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Book grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredBooks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 animate-[tapPulse_2s_ease-in-out_infinite]">🔍</div>
            <h3 className="text-xl font-semibold text-stone-500 mb-2 font-[family-name:var(--font-lexend)]">
              Hmm, we couldn&apos;t find that one...
            </h3>
            <p className="text-stone-400 mb-6 font-[family-name:var(--font-literata)]">
              Try a different search or clear your filters.
            </p>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 active:scale-[0.97] transition-all"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : isSearchActive ? (
          /* Flat grid when searching */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                isFree={freeBookIds.has(book.id)}
                isAdmin={!!isAdmin}
                onHide={toggleHideBook}
              />
            ))}
          </div>
        ) : (
          /* Grouped by tier when not searching */
          TIERS.map((tier) => {
            const tierBooks = filteredBooks.filter((b) => b.ageTier === tier);
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
                  {tierBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      isFree={freeBookIds.has(book.id)}
                      isAdmin={!!isAdmin}
                      onHide={toggleHideBook}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}

        {/* Admin: Hidden Books Section */}
        {isAdmin && hiddenIds.size > 0 && (
          <section className="mt-16 border-t-2 border-dashed border-stone-300 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-stone-400 uppercase tracking-wider">
                  Hidden Books ({hiddenIds.size})
                </span>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                  Admin Only
                </span>
              </div>
              <button
                onClick={() => setShowHidden(!showHidden)}
                className="text-sm text-brand-500 hover:text-brand-700 font-medium"
              >
                {showHidden ? "Hide" : "Show"}
              </button>
            </div>
            {showHidden && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(hiddenIds).map((id) => (
                  <div
                    key={id}
                    className="flex items-center justify-between bg-stone-100 rounded-xl px-4 py-3 border border-stone-200"
                  >
                    <span className="text-sm text-stone-600 font-mono truncate mr-3">{id}</span>
                    <button
                      onClick={() => toggleHideBook(id, false)}
                      className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-600 active:scale-95 transition-all whitespace-nowrap"
                    >
                      Unhide
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}

const TIER_COVER_EMOJI: Record<AgeTier, string> = {
  baby: "🌙",
  toddler: "🌈",
  early_reader: "📖",
  reader: "🔍",
  middle_grade: "🚀",
  young_adult: "⚡",
};

const TIER_COVER_GRADIENT: Record<AgeTier, string> = {
  baby: "from-pink-200 via-pink-100 to-rose-50",
  toddler: "from-green-200 via-emerald-100 to-teal-50",
  early_reader: "from-blue-200 via-sky-100 to-cyan-50",
  reader: "from-orange-200 via-amber-100 to-yellow-50",
  middle_grade: "from-purple-200 via-violet-100 to-fuchsia-50",
  young_adult: "from-slate-300 via-slate-200 to-gray-100",
};

function BookCard({ book, isFree, isAdmin, onHide }: {
  book: Book;
  isFree: boolean;
  isAdmin: boolean;
  onHide: (bookId: string, hide: boolean) => void;
}) {
  const colors = AGE_TIER_COLORS[book.ageTier];
  const [imgFailed, setImgFailed] = useState(false);
  const onImgError = useCallback(() => setImgFailed(true), []);

  const showImage = book.coverImage && !imgFailed;

  return (
    <Link
      href={`/book/${book.id}`}
      className="card-playful group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-brand-300 relative"
    >
      {/* Cover */}
      <div
        className={`h-48 relative overflow-hidden ${showImage ? colors.bg : `bg-gradient-to-br ${TIER_COVER_GRADIENT[book.ageTier]}`}`}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImage}
            alt={`Cover of ${book.title}`}
            loading="lazy"
            onError={onImgError}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          /* Decorative fallback — large emoji + decorative circles */
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Background circles */}
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/20" />
            <div className="absolute bottom-6 left-4 w-14 h-14 rounded-full bg-white/15" />
            <div className="absolute top-10 left-10 w-8 h-8 rounded-full bg-white/25" />
            {/* Central emoji */}
            <span className="text-5xl opacity-60 group-hover:scale-110 transition-transform duration-300 select-none drop-shadow-sm">
              {TIER_COVER_EMOJI[book.ageTier]}
            </span>
          </div>
        )}
        {/* Title overlay with gradient for legibility */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-8">
          <h3 className="text-lg font-bold text-white font-[family-name:var(--font-literata)] line-clamp-2 drop-shadow-md">
            {book.title}
          </h3>
        </div>

        {/* Admin: hide button */}
        {isAdmin && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHide(book.id, true);
            }}
            className="absolute top-2 right-2 z-20 bg-red-500/80 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            title={`Hide ${book.id}`}
          >
            Hide
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="p-5">
        <p className="text-sm text-stone-600 line-clamp-2 mb-3 font-[family-name:var(--font-literata)]">
          {book.synopsis}
        </p>

        <div className="flex items-center justify-between text-xs text-stone-400 mb-3">
          <span>{book.wordCount.toLocaleString()} words</span>
          <span>{estimateReadTime(book.wordCount)} min read</span>
          <span>{book.chapters.length} ch.</span>
        </div>

        {/* Reading level */}
        <div className="mb-3">
          <span className={`${colors.bg} ${colors.text} text-xs font-medium px-2 py-0.5 rounded-md`}>
            {book.readingLevel}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
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
}
