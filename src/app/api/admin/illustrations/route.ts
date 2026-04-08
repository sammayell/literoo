import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src", "data");

// GET: List all books from Supabase
export async function GET(request: Request) {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const tier = searchParams.get("tier");

  let query = supabase
    .from("book_illustrations")
    .select("*")
    .order("age_tier")
    .order("book_id");

  if (status && status !== "all") query = query.eq("approval_status", status);
  if (tier && tier !== "all") query = query.eq("age_tier", tier);

  const { data, error } = await query;

  if (error) {
    // Table doesn't exist yet — return empty with needsSetup flag
    return NextResponse.json({ books: [], stats: { total: 0, pending: 0, approved: 0, generating: 0, complete: 0 }, needsSetup: true });
  }

  // Compute stats from all data (unfiltered)
  const { data: allData } = await supabase.from("book_illustrations").select("approval_status");
  const all = allData || [];
  const stats = {
    total: all.length,
    pending: all.filter((b: any) => b.approval_status === "pending").length,
    approved: all.filter((b: any) => b.approval_status === "approved").length,
    generating: all.filter((b: any) => b.approval_status === "generating").length,
    complete: all.filter((b: any) => b.approval_status === "complete").length,
  };

  return NextResponse.json({ books: data || [], stats });
}

// POST: Actions
export async function POST(request: Request) {
  const supabase = createServiceRoleClient();
  const body = await request.json();

  if (body.action === "seed") {
    const batchSize = body.batchSize || 50;

    // Get list of already-seeded book IDs
    const { data: existing } = await supabase.from("book_illustrations").select("book_id");
    const existingIds = new Set((existing || []).map((e: any) => e.book_id));

    // Read book files from data directory
    const bookFiles = fs.readdirSync(DATA_DIR)
      .filter((f) => f.endsWith(".json") && f !== "illustration-admin.json")
      .sort();

    // Load art styles
    let artStyles: Record<string, Array<{ id: string; name: string; best_for: string[] }>> = {};
    try {
      const stylesPath = path.join(process.cwd(), "public", "art-styles.json");
      if (fs.existsSync(stylesPath)) {
        artStyles = JSON.parse(fs.readFileSync(stylesPath, "utf-8")).styles || {};
      }
    } catch {}

    // Find unseeded books
    const toSeed: any[] = [];
    for (const file of bookFiles) {
      if (toSeed.length >= batchSize) break;
      try {
        const book = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
        if (existingIds.has(book.id)) continue;

        let illustrationCount = 0;
        for (const ch of book.chapters || []) {
          if (ch.pages) illustrationCount += ch.pages.filter((p: any) => p.illustration).length;
          else if (ch.illustrations) illustrationCount += ch.illustrations.length;
        }

        const primaryGenre = book.genre?.[0] || "adventure";
        const genreStyles = artStyles[primaryGenre] || [];
        const matchingStyle = genreStyles.find((s) => s.best_for?.includes(book.ageTier)) || genreStyles[0];

        toSeed.push({
          book_id: book.id,
          book_title: book.title || book.id,
          age_tier: book.ageTier || "reader",
          genre: book.genre || [],
          art_style_id: matchingStyle?.id || null,
          art_style_name: matchingStyle?.name || null,
          character_refs: extractCharacters(book),
          approval_status: "pending",
          illustration_count: illustrationCount + 1,
          illustrations_generated: 0,
        });
      } catch {}
    }

    // Upsert to Supabase in one call
    if (toSeed.length > 0) {
      const { error } = await supabase.from("book_illustrations").upsert(toSeed, { onConflict: "book_id" });
      if (error) {
        return NextResponse.json({ error: error.message, hint: "Table may not exist. Create it in Supabase SQL editor." }, { status: 500 });
      }
    }

    // Count remaining
    const totalUnseeded = bookFiles.filter((f) => {
      try {
        const b = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf-8"));
        return !existingIds.has(b.id) && !toSeed.find((s) => s.book_id === b.id);
      } catch { return false; }
    }).length;

    return NextResponse.json({
      success: true,
      seeded: toSeed.length,
      total: (existing?.length || 0) + toSeed.length,
      remaining: totalUnseeded,
      done: totalUnseeded === 0,
    });
  }

  if (body.action === "approve") {
    await supabase.from("book_illustrations")
      .update({ approval_status: "approved", approved_at: new Date().toISOString() })
      .eq("book_id", body.bookId);
    return NextResponse.json({ success: true });
  }

  if (body.action === "approve_all_filtered") {
    let query = supabase.from("book_illustrations")
      .update({ approval_status: "approved", approved_at: new Date().toISOString() })
      .eq("approval_status", "pending");
    if (body.tier) query = query.eq("age_tier", body.tier);
    const { count } = await query;
    return NextResponse.json({ success: true, approved: count || 0 });
  }

  if (body.action === "reject") {
    await supabase.from("book_illustrations")
      .update({
        approval_status: "pending",
        art_style_id: null,
        art_style_name: null,
        notes: body.notes || "Rejected",
      })
      .eq("book_id", body.bookId);
    return NextResponse.json({ success: true });
  }

  if (body.action === "update_style") {
    await supabase.from("book_illustrations")
      .update({ art_style_id: body.artStyleId, art_style_name: body.artStyleName })
      .eq("book_id", body.bookId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

function extractCharacters(book: any): Array<{ name: string; description: string }> {
  const characters: Array<{ name: string; description: string }> = [];
  const seenNames = new Set<string>();

  for (const ch of book.chapters || []) {
    const illustrations = ch.pages
      ? ch.pages.filter((p: any) => p.illustration).map((p: any) => p.illustration)
      : ch.illustrations || [];

    for (const ill of illustrations) {
      const desc = ill.description || "";
      const matches = desc.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+(?:a|an|the)\s+([^.,]+)/g);
      if (matches) {
        for (const match of matches) {
          const parts = match.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+(?:a|an|the)\s+(.+)/);
          if (parts && !seenNames.has(parts[1])) {
            seenNames.add(parts[1]);
            characters.push({ name: parts[1], description: parts[2].trim() });
          }
        }
      }
    }
  }

  if (characters.length === 0 && book.synopsis) {
    const nonNames = new Set(["The", "And", "But", "When", "This", "That", "With", "From", "Into", "After", "Before", "Each", "Every", "One", "Two", "Three", "Can", "Her", "His", "She", "Little", "Big"]);
    const nameMatches = book.synopsis.match(/([A-Z][a-z]+)/g);
    if (nameMatches) {
      for (const name of nameMatches.slice(0, 3)) {
        if (!nonNames.has(name) && !seenNames.has(name)) {
          seenNames.add(name);
          characters.push({ name, description: "Main character" });
        }
      }
    }
  }

  return characters.slice(0, 5);
}
