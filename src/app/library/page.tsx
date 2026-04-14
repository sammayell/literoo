import { getAllBookSummaries, getFreeBookIds } from "@/lib/books";
import { Header } from "@/components/shared/Header";
import LibraryClient from "@/components/library/LibraryClient";

// Revalidate every 5 minutes so new books appear without a full rebuild
export const revalidate = 300;

export default function LibraryPage() {
  const books = getAllBookSummaries();
  const freeBookIds = getFreeBookIds();

  return (
    <div className="min-h-screen">
      <Header currentPage="library" />
      <LibraryClient books={books} freeBookIds={freeBookIds} />
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
