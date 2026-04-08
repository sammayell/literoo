"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { AGE_TIER_LABELS, AGE_TIER_COLORS, type AgeTier } from "@/lib/types";

interface BookIllustration {
  id: string;
  book_id: string;
  book_title: string;
  age_tier: AgeTier;
  genre: string[];
  art_style_id: string | null;
  art_style_name: string | null;
  style_ref_url: string | null;
  character_ref_urls: string[];
  character_refs: Array<{ name: string; description: string }>;
  approval_status: string;
  approved_at: string | null;
  illustration_count: number;
  illustrations_generated: number;
  notes: string | null;
}

interface ArtStyle {
  id: string;
  name: string;
  description: string;
  prompt_keywords: string;
  color_palette: string[];
  best_for: string[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  generating: "bg-blue-100 text-blue-800",
  complete: "bg-purple-100 text-purple-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminPage() {
  const [books, setBooks] = useState<BookIllustration[]>([]);
  const [artStyles, setArtStyles] = useState<Record<string, ArtStyle[]>>({});
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [needsSetup, setNeedsSetup] = useState(false);
  const [statsData, setStats] = useState({ total: 0, pending: 0, approved: 0, generating: 0, complete: 0 });
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;

  // Load art styles
  useEffect(() => {
    fetch("/art-styles.json")
      .then((r) => r.json())
      .then((data) => setArtStyles(data.styles || {}))
      .catch(() => {});
  }, []);

  // Load books
  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks(p?: number) {
    setLoading(true);
    const currentPage = p ?? page;
    try {
      const res = await fetch(`/api/admin/illustrations?status=${filterStatus}&tier=${filterTier}&page=${currentPage}&pageSize=${pageSize}`);
      const data = await res.json();
      setBooks(data.books || []);
      setTotalCount(data.totalCount || 0);
      if (data.stats) setStats(data.stats);
    } catch {}
    setLoading(false);
  }

  const [seedProgress, setSeedProgress] = useState<string | null>(null);

  async function seedBooks() {
    let totalSeeded = 0;
    let done = false;

    while (!done) {
      setSeedProgress(`Seeding... (${totalSeeded} books so far)`);
      const res = await fetch("/api/admin/illustrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed", batchSize: 50 }),
      });
      const data = await res.json();
      totalSeeded += data.seeded || 0;
      done = data.done || data.seeded === 0;
      setSeedProgress(`Seeded ${totalSeeded} books (${data.remaining || 0} remaining)`);
    }

    setSeedProgress(null);
    loadBooks();
  }

  async function approveAllFiltered() {
    const res = await fetch("/api/admin/illustrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve_all_filtered", tier: filterTier === "all" ? null : filterTier }),
    });
    const data = await res.json();
    alert(`Approved ${data.approved} books`);
    loadBooks();
  }

  async function approveBook(bookId: string) {
    await fetch("/api/admin/illustrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", bookId }),
    });
    loadBooks();
  }

  async function rejectBook(bookId: string) {
    await fetch("/api/admin/illustrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", bookId }),
    });
    loadBooks();
  }

  async function updateStyle(bookId: string, styleId: string, styleName: string) {
    await fetch("/api/admin/illustrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_style", bookId, artStyleId: styleId, artStyleName: styleName }),
    });
    loadBooks();
  }

  // Reload when filters or page change
  useEffect(() => {
    if (!loading) loadBooks();
  }, [filterTier, filterStatus, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filterTier, filterStatus]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const filteredBooks = books;
  const stats = statsData;

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 font-[family-name:var(--font-lexend)]">
              Illustration Admin
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Review and approve art styles and character references before generating illustrations
            </p>
          </div>
        </div>

        {needsSetup ? null : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Total", value: stats.total, color: "bg-stone-100" },
                { label: "Pending", value: stats.pending, color: "bg-yellow-100" },
                { label: "Approved", value: stats.approved, color: "bg-green-100" },
                { label: "Generating", value: stats.generating, color: "bg-blue-100" },
                { label: "Complete", value: stats.complete, color: "bg-purple-100" },
              ].map((s) => (
                <div key={s.label} className={`${s.color} rounded-xl p-4 text-center`}>
                  <div className="text-2xl font-bold text-stone-900">{s.value}</div>
                  <div className="text-xs text-stone-600">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                <option value="all">All Tiers</option>
                {(["baby", "toddler", "early_reader", "reader", "middle_grade", "young_adult"] as AgeTier[]).map((t) => (
                  <option key={t} value={t}>{AGE_TIER_LABELS[t]}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="generating">Generating</option>
                <option value="complete">Complete</option>
              </select>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={seedBooks}
                  disabled={!!seedProgress}
                  className="bg-brand-500 text-white text-xs px-4 py-2 rounded-lg hover:bg-brand-600 font-semibold disabled:opacity-50"
                >
                  {seedProgress || "Seed Books"}
                </button>
                {stats.pending > 0 && (
                  <button
                    onClick={approveAllFiltered}
                    className="bg-green-500 text-white text-xs px-4 py-2 rounded-lg hover:bg-green-600 font-semibold"
                  >
                    Approve All {filterTier !== "all" ? AGE_TIER_LABELS[filterTier as AgeTier] : ""} ({stats.pending} pending)
                  </button>
                )}
                <span className="text-sm text-stone-500">
                  {filteredBooks.length} books
                </span>
              </div>
            </div>

            {/* Book list */}
            {loading ? (
              <div className="text-center py-12 text-stone-400">Loading...</div>
            ) : filteredBooks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
                <p className="text-stone-500">
                  {books.length === 0
                    ? "No books in the illustration pipeline yet. Deploy books first, then seed them here."
                    : "No books match the current filters."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBooks.map((book) => {
                  const tierColors = AGE_TIER_COLORS[book.age_tier];
                  const statusColor = STATUS_COLORS[book.approval_status] || "bg-stone-100 text-stone-600";

                  // Get available styles for this book's genre
                  const primaryGenre = book.genre?.[0] || "adventure";
                  const availableStyles = artStyles[primaryGenre] || [];

                  return (
                    <div
                      key={book.book_id}
                      className="bg-white rounded-xl border border-stone-200 p-5 hover:border-stone-300 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Style preview */}
                        <div className="w-16 h-16 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                          {book.style_ref_url ? (
                            <img
                              src={book.style_ref_url}
                              alt="Style ref"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-2xl">🎨</span>
                          )}
                        </div>

                        {/* Book info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-stone-900 truncate">
                              {book.book_title || book.book_id}
                            </h3>
                            <span className={`${tierColors.bg} ${tierColors.text} text-xs px-2 py-0.5 rounded-full font-semibold`}>
                              {AGE_TIER_LABELS[book.age_tier]}
                            </span>
                            <span className={`${statusColor} text-xs px-2 py-0.5 rounded-full font-semibold`}>
                              {book.approval_status}
                            </span>
                          </div>

                          <div className="text-xs text-stone-500 mb-2">
                            {book.genre?.join(", ")} · {book.illustration_count} illustrations
                            {book.art_style_name && (
                              <> · Style: <strong>{book.art_style_name}</strong></>
                            )}
                          </div>

                          {/* Characters */}
                          {book.character_refs && book.character_refs.length > 0 && (
                            <div className="flex gap-1 mb-2">
                              {book.character_refs.map((c: { name: string }, i: number) => (
                                <span key={i} className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Style selector (when pending) */}
                          {book.approval_status === "pending" && availableStyles.length > 0 && (
                            <div className="mt-2">
                              <select
                                value={book.art_style_id || ""}
                                onChange={(e) => {
                                  const style = availableStyles.find((s) => s.id === e.target.value);
                                  if (style) updateStyle(book.book_id, style.id, style.name);
                                }}
                                className="text-xs px-2 py-1 border border-stone-300 rounded bg-white w-full max-w-xs"
                              >
                                <option value="">Select art style...</option>
                                {availableStyles.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} — {s.description.slice(0, 60)}...
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          {book.approval_status === "pending" && (
                            <>
                              <button
                                onClick={() => approveBook(book.book_id)}
                                className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600 font-semibold"
                              >
                                Approve
                              </button>
                            </>
                          )}
                          {book.approval_status === "approved" && (
                            <button
                              onClick={() => rejectBook(book.book_id)}
                              className="bg-stone-200 text-stone-600 text-xs px-3 py-1.5 rounded-lg hover:bg-stone-300 font-semibold"
                            >
                              Re-generate
                            </button>
                          )}
                          <Link
                            href={`/book/${book.book_id}`}
                            className="bg-stone-100 text-stone-600 text-xs px-3 py-1.5 rounded-lg hover:bg-stone-200 font-semibold"
                          >
                            Preview
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm border border-stone-300 rounded-lg disabled:opacity-30 hover:bg-stone-100"
                >
                  Previous
                </button>
                <span className="text-sm text-stone-500">
                  Page {page + 1} of {totalPages} ({totalCount} books)
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm border border-stone-300 rounded-lg disabled:opacity-30 hover:bg-stone-100"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
