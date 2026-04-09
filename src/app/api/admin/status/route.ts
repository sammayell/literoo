import { NextResponse } from "next/server";
import { createServiceRoleClient, createServerSupabase } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

// Admin emails that can access admin routes
const ADMIN_EMAILS = ["sam@sammayell.com", "hello@chillplayvibe.com"];

export async function GET() {
  // Auth check — only admin emails can access
  try {
    const authSupabase = await createServerSupabase();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const DATA_DIR = path.join(process.cwd(), "src", "data");

  // Count books by tier from data directory
  const byTier: Record<string, number> = {};
  let total = 0;

  try {
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json") && f !== "illustration-admin.json");
    for (const file of files) {
      try {
        const book = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
        const tier = book.ageTier || "unknown";
        byTier[tier] = (byTier[tier] || 0) + 1;
        total++;
      } catch {}
    }
  } catch {}

  // Get illustration pipeline stats
  let illustrations = { total: 0, pending: 0, review: 0, approved: 0, generating: 0, complete: 0 };
  try {
    const { data } = await supabase.from("book_illustrations").select("approval_status");
    if (data) {
      illustrations.total = data.length;
      for (const row of data) {
        const s = row.approval_status as keyof typeof illustrations;
        if (s in illustrations) {
          (illustrations as any)[s]++;
        }
      }
    }
  } catch {}

  // Check API status
  let anthropicStatus = "unknown";
  try {
    const keyPath = path.join(process.cwd(), "..", "content", ".anthropic_key");
    if (fs.existsSync(keyPath)) {
      const key = fs.readFileSync(keyPath, "utf-8").trim();
      // Quick test with minimal request
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 5,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      anthropicStatus = resp.ok ? "active" : "no_credits";
    }
  } catch {
    anthropicStatus = "error";
  }

  // Load cost data if available
  let costs = null;
  try {
    const costLogPath = path.join(process.cwd(), "..", "content", "cost-log.json");
    if (fs.existsSync(costLogPath)) {
      costs = JSON.parse(fs.readFileSync(costLogPath, "utf-8"));
    }
  } catch {}

  return NextResponse.json({
    books: { total, byTier },
    illustrations,
    api: {
      anthropic: anthropicStatus,
      gemini: "unknown",
    },
    costs,
  });
}
