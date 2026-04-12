import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

const ADMIN_EMAILS = ["sam@sammayell.com", "hello@chillplayvibe.com"];
const HIDDEN_FILE = path.join(process.cwd(), "src", "data", "hidden-books.json");

function getHiddenIds(): string[] {
  try {
    return JSON.parse(fs.readFileSync(HIDDEN_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveHiddenIds(ids: string[]) {
  fs.writeFileSync(HIDDEN_FILE, JSON.stringify(ids, null, 2));
}

// GET — return list of hidden book IDs
export async function GET() {
  try {
    const authSupabase = await createServerSupabase();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({ hidden: getHiddenIds() });
}

// POST — toggle a book's hidden status
export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabase();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { bookId, action } = await request.json();
  if (!bookId || !["hide", "unhide"].includes(action)) {
    return NextResponse.json({ error: "Invalid request. Need bookId and action (hide/unhide)" }, { status: 400 });
  }

  const hidden = getHiddenIds();

  if (action === "hide" && !hidden.includes(bookId)) {
    hidden.push(bookId);
  } else if (action === "unhide") {
    const idx = hidden.indexOf(bookId);
    if (idx >= 0) hidden.splice(idx, 1);
  }

  saveHiddenIds(hidden);

  return NextResponse.json({ hidden, toggled: bookId, action });
}
