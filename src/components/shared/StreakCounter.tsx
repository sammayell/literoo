"use client";

import { useEffect, useState } from "react";
import { getStreak, getDailyReadingData } from "@/lib/storage";

interface StreakCounterProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function StreakCounter({ size = "md", showLabel = true }: StreakCounterProps) {
  const [streak, setStreak] = useState(0);
  const [todayRead, setTodayRead] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const currentStreak = getStreak();
    setStreak(currentStreak);

    const dailyData = getDailyReadingData(1);
    setTodayRead(dailyData.length > 0 && dailyData[0].seconds > 0);

    // Trigger pulse animation if streak > 0
    if (currentStreak > 0) {
      setAnimate(true);
      const timeout = setTimeout(() => setAnimate(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, []);

  if (streak <= 0) return null;

  const sizeClasses = {
    sm: {
      container: "gap-1.5",
      number: "text-lg",
      flame: "text-lg",
      label: "text-xs",
    },
    md: {
      container: "gap-2",
      number: "text-2xl",
      flame: "text-2xl",
      label: "text-sm",
    },
    lg: {
      container: "gap-3",
      number: "text-4xl",
      flame: "text-4xl",
      label: "text-base",
    },
  };

  const s = sizeClasses[size];

  return (
    <div
      className={`inline-flex items-center ${s.container} ${
        animate ? "animate-streak-pulse" : ""
      }`}
    >
      <span className={`${s.flame} ${animate ? "animate-bounce" : ""}`}>
        {"\u{1F525}"}
      </span>
      <span
        className={`${s.number} font-bold text-stone-900 font-[family-name:var(--font-lexend)]`}
      >
        {streak}
      </span>
      {showLabel && (
        <span className={`${s.label} text-stone-500 font-[family-name:var(--font-literata)]`}>
          {streak === 1 ? "day streak" : "days streak"}
        </span>
      )}
      {todayRead && (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium font-[family-name:var(--font-lexend)]">
          Today
        </span>
      )}
    </div>
  );
}
