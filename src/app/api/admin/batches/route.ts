import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

const ADMIN_EMAILS = ["sam@sammayell.com", "hello@chillplayvibe.com"];

// Keep this in sync with the targets in the book-pipeline skill.
const TIER_TARGETS: Record<string, number> = {
  baby: 150,
  toddler: 200,
  early_reader: 200,
  reader: 200,
  middle_grade: 150,
  young_adult: 100,
};

interface BatchEntry {
  id: string;
  tier: string;
  count: number;
  submitted_at: string;
  status: string;
  specs_file?: string;
}

export async function GET() {
  // Auth — admin only
  try {
    const authSupabase = await createServerSupabase();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const contentDir = path.join(process.cwd(), "..", "content");
  const stateFile = path.join(contentDir, "unified-batch-state.json");
  const outputDir = path.join(contentDir, "output");

  // --- Batch state ---
  let batches: BatchEntry[] = [];
  let stateMtimeMs: number | null = null;
  try {
    const stat = fs.statSync(stateFile);
    stateMtimeMs = stat.mtimeMs;
    const raw = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
    batches = Array.isArray(raw?.batches) ? (raw.batches as BatchEntry[]) : [];
  } catch {}

  // Sort newest first
  batches.sort((a, b) => (b.submitted_at || "").localeCompare(a.submitted_at || ""));

  const inFlight = batches.filter((b) => b.status !== "collected");
  const recent = batches.slice(0, 25);

  // --- Book counts from output/ ---
  const outputByTier: Record<string, number> = {};
  let outputTotal = 0;
  try {
    const files = fs.readdirSync(outputDir).filter((f) => f.startsWith("v2-") && f.endsWith(".json"));
    for (const f of files) {
      // "v2-<tier>-<...>.json" — tier may contain underscore (early_reader, middle_grade, young_adult)
      const m = f.match(/^v2-([a-z_]+?)-/);
      if (m) {
        const tier = m[1];
        outputByTier[tier] = (outputByTier[tier] || 0) + 1;
        outputTotal++;
      }
    }
  } catch {}

  const tierProgress = Object.keys(TIER_TARGETS).map((tier) => {
    const have = outputByTier[tier] || 0;
    const target = TIER_TARGETS[tier];
    return {
      tier,
      have,
      target,
      gap: Math.max(0, target - have),
      pct: target > 0 ? Math.min(100, Math.round((have / target) * 100)) : 0,
    };
  });

  // --- Cost log ---
  let costs: unknown = null;
  try {
    const costLogPath = path.join(contentDir, "cost-log.json");
    if (fs.existsSync(costLogPath)) {
      costs = JSON.parse(fs.readFileSync(costLogPath, "utf-8"));
    }
  } catch {}

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      stateMtime: stateMtimeMs ? new Date(stateMtimeMs).toISOString() : null,
      totals: {
        batches: batches.length,
        inFlight: inFlight.length,
        outputTotal,
      },
      tierProgress,
      inFlight,
      recent,
      costs,
    },
    {
      // Don't cache — this is a live dashboard
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
