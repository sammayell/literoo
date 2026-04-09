import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

export async function GET() {
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

  return NextResponse.json({
    books: { total, byTier },
    illustrations,
    api: {
      anthropic: anthropicStatus,
      gemini: "unknown", // Would need a test call to verify
    },
  });
}
