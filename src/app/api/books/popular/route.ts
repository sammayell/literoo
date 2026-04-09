import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// GET: Return the most-read books (by reading_progress entries)
export async function GET(request: Request) {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get("tier");
  const limit = parseInt(searchParams.get("limit") || "10");

  // Count reading_progress entries per book_id (most read = most popular)
  let query = supabase
    .from("reading_progress")
    .select("book_id")
    .order("last_read_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ popular: [] });
  }

  // Count occurrences of each book_id
  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.book_id] = (counts[row.book_id] || 0) + 1;
  }

  // Sort by count descending
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([bookId, readCount]) => ({ bookId, readCount }));

  return NextResponse.json({ popular: sorted });
}

// POST: Record a book read event (called from the reader)
export async function POST(request: Request) {
  const body = await request.json();
  const { bookId, action } = body;

  if (!bookId) {
    return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
  }

  // For now, popularity is derived from reading_progress table
  // which is already populated by the cloud-storage dual-write system.
  // This endpoint exists for future direct tracking if needed.

  return NextResponse.json({ success: true });
}
