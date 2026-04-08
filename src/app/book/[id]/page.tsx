import { getBookById, getAllBooks, isFreeBook } from "@/lib/books";
import { notFound } from "next/navigation";
import { BookReaderClient } from "@/components/reader/BookReaderClient";

export function generateStaticParams() {
  return getAllBooks().map((book) => ({ id: book.id }));
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
