"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import type { BookSummary } from "@/lib/books";
import { AGE_TIER_COLORS, AgeTier } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

const ADMIN_EMAILS = ["sam@sammayell.com", "hello@chillplayvibe.com"];
const PAGE_SIZE = 24;

function estimateReadTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 150));
}

interface Props {
  books: BookSummary[];
  tier: AgeTier;
  tierLabel: string;
  freeBookIds: string[];
}

export default function LibraryTierClient({
  books,
  tier,
  tierLabel,
  freeBookIds: freeIdsArray,
}: Props) {
  const freeBookIds = useMemo(() => new Set(freeIdsArray), [freeIdsArray]);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const colors = AGE_TIER_COLORS[tier];

  const { user } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

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

  const topGenres = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => b.genre.forEach((g) => {
      counts[g] = (counts[g] || 0) + 1;
    }));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([g]) => g);
  }, [books]);

  const filtered = useMemo(() => {
    let result = books;
    if (search.length > 0) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.synopsis.toLowerCase().includes(q)
      );
    }
    if (genreFilter) {
      result = result.filter((b) => b.genre.includes(genreFilter));
    }
    return result;
  }, [books, search, genreFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, genreFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPageBooks = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      {/* Hero */}
      <section className={`${colors.bg} py-12 px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-7xl mx-auto">
          <Link
            href="/library"
            className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900 mb-4 font-medium"
          >
            ← All ages
          </Link>
          <h1 className={`text-4xl md:text-5xl font-bold ${colors.text} font-[family-name:var(--font-lexend)] mb-2`}>
            {tierLabel}
          </h1>
          <p className="text-lg text-stone-700 font-[family-name:var(--font-literata)]">
            {books.length} {books.length === 1 ? "book" : "books"}
            {filtered.length !== books.length ? ` — showing ${filtered.length}` : ""}
          </p>
        </div>
      </section>

      {/* Search + genre filter */}
      <section className="border-b border-stone-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search titles & stories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 font-[family-name:var(--font-literata)]"
          />
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setGenreFilter("")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
                !genreFilter ? `${colors.bg} ${colors.text}` : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              All
            </button>
            {topGenres.map((g) => (
              <button
                key={g}
                onClick={() => setGenreFilter(g === genreFilter ? "" : g)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap capitalize ${
                  genreFilter === g ? `${colors.bg} ${colors.text}` : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {g.replace(/-/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {currentPageBooks.length === 0 ? (
          <div className="text-center py-20 text-stone-500">
            No books match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentPageBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                isFree={freeBookIds.has(book.id)}
                isAdmin={!!isAdmin}
                isHidden={hiddenIds.has(book.id)}
                onHide={toggleHideBook}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 disabled:opacity-40 hover:bg-stone-200 font-medium"
            >
              ← Prev
            </button>
            <span className="text-sm text-stone-500 mx-4">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 disabled:opacity-40 hover:bg-stone-200 font-medium"
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </>
  );
}

function BookCard({ book, isAdmin, onHide }: {
  book: BookSummary;
  isFree: boolean;
  isAdmin: boolean;
  isHidden: boolean;
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
      <div className={`aspect-[3/4] relative overflow-hidden ${showImage ? colors.bg : `bg-gradient-to-br ${colors.bg}`}`}>
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
          <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-60">
            📖
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-8">
          <h3 className="text-lg font-bold text-white font-[family-name:var(--font-literata)] line-clamp-2 drop-shadow-md">
            {book.title}
          </h3>
        </div>
        {isAdmin && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHide(book.id, true);
            }}
            className="absolute top-2 right-2 z-20 bg-red-500/80 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Hide
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm text-stone-600 line-clamp-2 mb-3 font-[family-name:var(--font-literata)]">
          {book.synopsis}
        </p>
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span>{book.wordCount.toLocaleString()} words</span>
          <span>{estimateReadTime(book.wordCount)} min</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {book.genre.slice(0, 3).map((g) => (
            <span key={g} className="bg-stone-100 text-stone-500 px-2 py-0.5 rounded-md text-xs capitalize">
              {g.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
