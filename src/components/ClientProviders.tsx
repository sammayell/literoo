"use client";

import { ProgressProvider } from "@/lib/progress-context";
import { type ReactNode } from "react";

export function ClientProviders({ children }: { children: ReactNode }) {
  return <ProgressProvider>{children}</ProgressProvider>;
}
