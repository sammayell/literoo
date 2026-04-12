"use client";

import confetti from "canvas-confetti";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Standard burst — book completion, quiz pass */
export function fireConfetti() {
  if (prefersReducedMotion()) return;
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#ee7a20", "#f19242", "#fad5ac", "#22c55e", "#a855f7", "#3b82f6"],
  });
}

/** Left + right cannons — big wins (100% quiz, milestone unlock) */
export function fireConfettiCannon() {
  if (prefersReducedMotion()) return;
  const defaults = {
    particleCount: 50,
    spread: 55,
    colors: ["#ee7a20", "#f19242", "#fad5ac", "#22c55e", "#a855f7", "#3b82f6"],
  };
  confetti({ ...defaults, angle: 60, origin: { x: 0, y: 0.65 } });
  confetti({ ...defaults, angle: 120, origin: { x: 1, y: 0.65 } });
}

/** Star shapes — milestone/challenge completion */
export function fireStars() {
  if (prefersReducedMotion()) return;
  confetti({
    particleCount: 40,
    spread: 100,
    origin: { y: 0.5 },
    shapes: ["star"],
    colors: ["#ee7a20", "#fbbf24", "#f59e0b"],
    scalar: 1.2,
  });
}
