import { NextRequest, NextResponse } from "next/server";
import { getAllBooks } from "@/lib/books";

export async function GET(request: NextRequest) {
  const tier = request.nextUrl.searchParams.get("tier");

  if (!tier) {
    return NextResponse.json(
      { error: "Missing tier parameter" },
      { status: 400 }
    );
  }

  const allBooks = getAllBooks();
  const tierBooks = allBooks.filter((b) => b.ageTier === tier);

  // Pick up to 3 books from the tier, preferring variety in genre
  const selected: typeof tierBooks = [];
  const usedGenres = new Set<string>();

  // First pass: pick books with unique genres
  for (const book of tierBooks) {
    if (selected.length >= 3) break;
    const hasNewGenre = book.genre.some((g) => !usedGenres.has(g));
    if (hasNewGenre) {
      selected.push(book);
      book.genre.forEach((g) => usedGenres.add(g));
    }
  }

  // Fill remaining slots
  for (const book of tierBooks) {
    if (selected.length >= 3) break;
    if (!selected.find((s) => s.id === book.id)) {
      selected.push(book);
    }
  }

  // Return only the metadata the client needs
  const recommendations = selected.map((b) => ({
    id: b.id,
    title: b.title,
    synopsis: b.synopsis,
    ageTier: b.ageTier,
    genre: b.genre,
    wordCount: b.wordCount,
  }));

  return NextResponse.json({ books: recommendations });
}
