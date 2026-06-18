"use client";

import { Link } from "@/i18n/navigation";
import { EditorialCard } from "@/components/ui/EditorialCard";
import { MetaChip } from "@/components/ui/MetaChip";
import { BOOK_COLLECTION_LABELS, type BookRecord } from "@/types/book";

type BookCardProps = {
  book: BookRecord;
};

export default function BookCard({ book }: BookCardProps) {
  const authors = book.authors.join(", ");

  return (
    <EditorialCard
      href={`/biblioteca/${book.slug}`}
      title={book.title}
      subtitle={authors}
      imageSrc={book.cover}
      imageAlt={book.title}
      meta={
        <>
          {book.year ? <MetaChip tone="blue">{String(book.year)}</MetaChip> : null}
          {book.language ? <MetaChip>{book.language.toUpperCase()}</MetaChip> : null}
          <MetaChip tone="blue">{BOOK_COLLECTION_LABELS[book.collection]}</MetaChip>
          {book.rating ? <MetaChip tone="yellow">{`★ ${book.rating}`}</MetaChip> : null}
        </>
      }
      footer={
        <div className="space-y-3">
          <p className="line-clamp-2 text-sm leading-6 text-slate-400">{book.summary}</p>
          <Link
            href={`/biblioteca/${book.slug}`}
            className="text-sm font-medium text-electric-blue transition-colors hover:text-white"
          >
            Ver ficha →
          </Link>
        </div>
      }
    />
  );
}
