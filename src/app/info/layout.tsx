import Link from "next/link";
import { Header } from "@/components/shared/Header";

export default function InfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      <Header currentPage="info" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
