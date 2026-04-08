import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Ensure the table exists (runs once)
async function ensureTable() {
  const supabase = createServiceRoleClient();

  await supabase.rpc("exec_sql", {
    sql: `
      CREATE TABLE IF NOT EXISTS book_illustrations (
        id uuid primary key default gen_random_uuid(),
        book_id text unique not null,
        book_title text,
        age_tier text not null,
        genre text[] default '{}',
        art_style_id text,
        art_style_name text,
        character_refs jsonb default '[]',
        style_ref_url text,
        character_ref_urls jsonb default '[]',
        approval_status text default 'pending',
        approved_by uuid,
        approved_at timestamptz,
        notes text,
        illustration_count integer default 0,
        illustrations_generated integer default 0,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      );
    `,
  }).catch(() => {
    // Table might already exist or RPC might not be available
    // That's fine — we'll handle errors on actual queries
  });
}

// GET: List all books with their illustration status
export async function GET(request: Request) {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // pending, approved, generating, complete
  const tier = searchParams.get("tier");

  let query = supabase
    .from("book_illustrations")
    .select("*")
    .order("age_tier")
    .order("book_id");

  if (status) query = query.eq("approval_status", status);
  if (tier) query = query.eq("age_tier", tier);

  const { data, error } = await query;

  if (error) {
    // Table might not exist yet
    if (error.message?.includes("does not exist")) {
      return NextResponse.json({ books: [], needsSetup: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ books: data || [] });
}

// POST: Upsert a book's illustration config (style, characters)
export async function POST(request: Request) {
  const supabase = createServiceRoleClient();
  const body = await request.json();

  if (body.action === "setup") {
    // Create table and seed with book data
    await ensureTable();
    return NextResponse.json({ success: true, message: "Table created" });
  }

  if (body.action === "seed") {
    // Seed books from the provided list
    const books = body.books || [];
    for (const book of books) {
      await supabase.from("book_illustrations").upsert(
        {
          book_id: book.id,
          book_title: book.title,
          age_tier: book.ageTier,
          genre: book.genre,
          art_style_id: book.artStyleId || null,
          art_style_name: book.artStyleName || null,
          character_refs: book.characterRefs || [],
          illustration_count: book.illustrationCount || 0,
          approval_status: "pending",
        },
        { onConflict: "book_id" }
      );
    }
    return NextResponse.json({ success: true, seeded: books.length });
  }

  if (body.action === "approve") {
    const { data, error } = await supabase
      .from("book_illustrations")
      .update({
        approval_status: "approved",
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("book_id", body.bookId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "reject") {
    const { data, error } = await supabase
      .from("book_illustrations")
      .update({
        approval_status: "pending",
        art_style_id: null,
        art_style_name: null,
        style_ref_url: null,
        character_ref_urls: [],
        notes: body.notes || "Rejected — regenerating",
        updated_at: new Date().toISOString(),
      })
      .eq("book_id", body.bookId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "update_style") {
    const { data, error } = await supabase
      .from("book_illustrations")
      .update({
        art_style_id: body.artStyleId,
        art_style_name: body.artStyleName,
        updated_at: new Date().toISOString(),
      })
      .eq("book_id", body.bookId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
