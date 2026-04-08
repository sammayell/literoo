import type { Metadata } from "next";
import { Lexend, Literata } from "next/font/google";
import { ClientProviders } from "@/components/ClientProviders";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Literoo — Stories That Grow With Your Child",
  description:
    "1,000+ illustrated stories for ages 1-18. AI-crafted, educator-reviewed. From bedtime board books to young adult thrillers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lexend.variable} ${literata.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
