import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Use a local JSON file as the admin database
// This avoids Supabase table creation issues and works immediately
// Can migrate to Supabase later
const DATA_DIR = path.join(process.cwd(), "src", "data");
const ADMIN_FILE = path.join(DATA_DIR, "illustration-admin.json");

interface BookEntry {
  book_id: string;
  book_title: string;
  age_tier: string;
  genre: string[];
  art_style_id: string | null;
  art_style_name: string | null;
  characters: Array<{ name: string; description: string }>;
  style_ref_url: string | null;
  character_ref_urls: string[];
  approval_status: string; // pending | approved | generating | complete
  illustration_count: number;
  illustrations_generated: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function loadAdmin(): BookEntry[] {
  try {
    if (fs.existsSync(ADMIN_FILE)) {
      return JSON.parse(fs.readFileSync(ADMIN_FILE, "utf-8"));
    }
  } catch {}
  return [];
}

function saveAdmin(entries: BookEntry[]): void {
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(entries, null, 2));
}

// GET: List all books with their illustration status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const tier = searchParams.get("tier");

  let books = loadAdmin();

  if (status && status !== "all") books = books.filter((b) => b.approval_status === status);
  if (tier && tier !== "all") books = books.filter((b) => b.age_tier === tier);

  // Stats
  const all = loadAdmin();
  const stats = {
    total: all.length,
    pending: all.filter((b) => b.approval_status === "pending").length,
    approved: all.filter((b) => b.approval_status === "approved").length,
    generating: all.filter((b) => b.approval_status === "generating").length,
    complete: all.filter((b) => b.approval_status === "complete").length,
  };

  return NextResponse.json({ books, stats });
}

// POST: Actions on books
export async function POST(request: Request) {
  const body = await request.json();
  const entries = loadAdmin();

  if (body.action === "seed") {
    // Seed from book JSON files in batches of 50
    const batchSize = body.batchSize || 50;
    const bookFiles = fs.readdirSync(DATA_DIR)
      .filter((f) => f.endsWith(".json") && f !== "illustration-admin.json")
      .sort();
    const existingIds = new Set(entries.map((e) => e.book_id));

    // Find files that haven't been seeded yet
    const unseeded = bookFiles.filter((f) => {
      try {
        const book = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf-8"));
        return !existingIds.has(book.id);
      } catch { return false; }
    });

    // Only process one batch
    const batch = unseeded.slice(0, batchSize);
    let seeded = 0;

    // Load art styles once
    let artStyles: Record<string, Array<{ id: string; name: string; best_for: string[] }>> = {};
    try {
      const stylesPath = path.join(process.cwd(), "public", "art-styles.json");
      if (fs.existsSync(stylesPath)) {
        const stylesData = JSON.parse(fs.readFileSync(stylesPath, "utf-8"));
        artStyles = stylesData.styles || {};
      }
    } catch {}

    for (const file of batch) {
      try {
        const book = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
        if (existingIds.has(book.id)) continue;

        let illustrationCount = 0;
        for (const ch of book.chapters || []) {
          if (ch.pages) {
            illustrationCount += ch.pages.filter((p: any) => p.illustration).length;
          } else if (ch.illustrations) {
            illustrationCount += ch.illustrations.length;
          }
        }

        const characters = extractCharacters(book);
        const primaryGenre = book.genre?.[0] || "adventure";
        const genreStyles = artStyles[primaryGenre] || [];
        const matchingStyle = genreStyles.find((s) =>
          s.best_for?.includes(book.ageTier)
        ) || genreStyles[0];

        entries.push({
          book_id: book.id,
          book_title: book.title || book.id,
          age_tier: book.ageTier,
          genre: book.genre || [],
          art_style_id: matchingStyle?.id || null,
          art_style_name: matchingStyle?.name || null,
          characters,
          style_ref_url: null,
          character_ref_urls: [],
          approval_status: "pending",
          illustration_count: illustrationCount + 1,
          illustrations_generated: 0,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        seeded++;
      } catch {}
    }

    saveAdmin(entries);
    const remaining = unseeded.length - batch.length;
    return NextResponse.json({
      success: true,
      seeded,
      total: entries.length,
      remaining,
      done: remaining === 0,
    });
  }

  if (body.action === "approve") {
    const idx = entries.findIndex((e) => e.book_id === body.bookId);
    if (idx >= 0) {
      entries[idx].approval_status = "approved";
      entries[idx].updated_at = new Date().toISOString();
      saveAdmin(entries);
    }
    return NextResponse.json({ success: true });
  }

  if (body.action === "approve_all_filtered") {
    // Approve all books matching tier/status filter
    let count = 0;
    for (const entry of entries) {
      if (entry.approval_status !== "pending") continue;
      if (body.tier && entry.age_tier !== body.tier) continue;
      entry.approval_status = "approved";
      entry.updated_at = new Date().toISOString();
      count++;
    }
    saveAdmin(entries);
    return NextResponse.json({ success: true, approved: count });
  }

  if (body.action === "reject") {
    const idx = entries.findIndex((e) => e.book_id === body.bookId);
    if (idx >= 0) {
      entries[idx].approval_status = "pending";
      entries[idx].art_style_id = null;
      entries[idx].art_style_name = null;
      entries[idx].style_ref_url = null;
      entries[idx].character_ref_urls = [];
      entries[idx].notes = body.notes || "Rejected — needs new style";
      entries[idx].updated_at = new Date().toISOString();
      saveAdmin(entries);
    }
    return NextResponse.json({ success: true });
  }

  if (body.action === "update_style") {
    const idx = entries.findIndex((e) => e.book_id === body.bookId);
    if (idx >= 0) {
      entries[idx].art_style_id = body.artStyleId;
      entries[idx].art_style_name = body.artStyleName;
      entries[idx].updated_at = new Date().toISOString();
      saveAdmin(entries);
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// Extract character names and descriptions from book text
function extractCharacters(book: any): Array<{ name: string; description: string }> {
  const characters: Array<{ name: string; description: string }> = [];
  const seenNames = new Set<string>();

  // Check illustration descriptions for character mentions
  for (const ch of book.chapters || []) {
    const illustrations = ch.pages
      ? ch.pages.filter((p: any) => p.illustration).map((p: any) => p.illustration)
      : ch.illustrations || [];

    for (const ill of illustrations) {
      const desc = ill.description || ill.alt || "";
      // Look for character descriptions in illustration text
      // Pattern: "Name, a/an [description]" or "Name (description)"
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

  // If no characters found from illustrations, use the synopsis
  if (characters.length === 0 && book.synopsis) {
    const nameMatches = book.synopsis.match(/([A-Z][a-z]+)/g);
    if (nameMatches) {
      // Filter out common non-name words
      const nonNames = new Set(["The", "And", "But", "When", "This", "That", "With", "From", "Into", "After", "Before", "Each", "Every", "One", "Two", "Three"]);
      for (const name of nameMatches.slice(0, 3)) {
        if (!nonNames.has(name) && !seenNames.has(name)) {
          seenNames.add(name);
          characters.push({ name, description: "Main character" });
        }
      }
    }
  }

  return characters.slice(0, 5); // Max 5 characters
}
