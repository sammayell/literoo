"use client";

import { ProgressProvider } from "@/lib/progress-context";
import { AuthProvider } from "@/lib/auth-context";
import { type ReactNode } from "react";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProgressProvider>{children}</ProgressProvider>
    </AuthProvider>
  );
}
