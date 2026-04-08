import { getAllBooks } from "@/lib/books";
import { AGE_TIER_LABELS } from "@/lib/types";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { Header } from "@/components/shared/Header";

export default function DashboardPage() {
  const books = getAllBooks();

  // Serialize only the metadata the client needs (no fs references)
  const bookMeta = books.map((b) => ({
    id: b.id,
    title: b.title,
    ageTier: b.ageTier,
    ageTierLabel: AGE_TIER_LABELS[b.ageTier],
    wordCount: b.wordCount,
    totalPages: b.chapters.reduce(
      (sum, ch) => sum + (ch.pages?.length || 1),
      0
    ),
    hasQuiz: !!b.quiz,
    hasPuzzle: !!b.puzzle,
  }));

  return (
    <>
      <Header currentPage="dashboard" />
      <DashboardClient books={bookMeta} />
    </>
  );
}
