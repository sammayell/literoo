import type { Metadata } from "next";
import { getBookById, getAllBooks, isFreeBook } from "@/lib/books";
import { notFound } from "next/navigation";
import { BookReaderClient } from "@/components/reader/BookReaderClient";
import { AGE_TIER_LABELS } from "@/lib/types";

export function generateStaticParams() {
  return getAllBooks().map((book) => ({ id: book.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const book = getBookById(id);
  if (!book) return {};

  return {
    title: `${book.title} — ${AGE_TIER_LABELS[book.ageTier]}`,
    description: book.synopsis,
    openGraph: {
      title: book.title,
      description: book.synopsis,
      type: "article",
      url: `https://literoo.com/book/${book.id}`,
    },
  };
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = getBookById(id);
  if (!book) notFound();

  return <BookReaderClient book={book} isFree={isFreeBook(book.id)} />;
}
