import { notFound } from "next/navigation";
import { getBookSummariesByTier, getFreeBookIds } from "@/lib/books";
import { AGE_TIER_LABELS, AgeTier } from "@/lib/types";
import { Header } from "@/components/shared/Header";
import LibraryTierClient from "@/components/library/LibraryTierClient";

export const revalidate = 300;

const VALID_TIERS: AgeTier[] = [
  "baby",
  "toddler",
  "early_reader",
  "reader",
  "middle_grade",
  "young_adult",
];

export default async function LibraryTierPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier } = await params;
  if (!VALID_TIERS.includes(tier as AgeTier)) {
    notFound();
  }

  const books = getBookSummariesByTier(tier);
  const freeBookIds = getFreeBookIds();
  const label = AGE_TIER_LABELS[tier as AgeTier];

  return (
    <div className="min-h-screen">
      <Header currentPage="library" />
      <LibraryTierClient
        books={books}
        tier={tier as AgeTier}
        tierLabel={label}
        freeBookIds={freeBookIds}
      />
      <footer className="bg-stone-900 text-stone-400 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm">
          <p>Literoo by ChillPlayVibe. AI-crafted stories, educator-reviewed.</p>
        </div>
      </footer>
    </div>
  );
}

export async function generateStaticParams() {
  return VALID_TIERS.map((tier) => ({ tier }));
}
