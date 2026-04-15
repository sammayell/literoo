import { NextRequest, NextResponse } from "next/server";
import { getBookSummariesByTier } from "@/lib/books";

export const revalidate = 300;

// Returns up to `limit` books from the given tier, excluding a book ID.
// Used on the end-of-book page to suggest what to read next.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tier = searchParams.get("tier") || "";
  const exclude = searchParams.get("exclude") || "";
  const limit = Math.min(12, parseInt(searchParams.get("limit") || "6", 10));

  if (!tier) {
    return NextResponse.json({ books: [] });
  }

  const all = getBookSummariesByTier(tier).filter((b) => b.id !== exclude);

  // Shuffle (deterministic seed per day so caching works)
  const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 6)); // rotates every 6h
  const shuffled = [...all].sort((a, b) => {
    const hashA = hashString(a.id + seed);
    const hashB = hashString(b.id + seed);
    return hashA - hashB;
  });

  return NextResponse.json({ books: shuffled.slice(0, limit) });
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
