"use client";

import { useEffect, useState } from "react";
import { getStreak } from "@/lib/storage";
import { StreakCounter } from "./StreakCounter";

export function HomeStreak() {
  const [hasStreak, setHasStreak] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasStreak(getStreak() > 0);
  }, []);

  if (!mounted || !hasStreak) return null;

  return (
    <div className="flex items-center justify-center mt-6 py-3 px-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200 shadow-sm mx-auto w-fit">
      <StreakCounter size="sm" />
    </div>
  );
}
