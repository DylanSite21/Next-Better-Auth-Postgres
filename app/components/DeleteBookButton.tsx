"use client";

import { deleteBook } from "@/actions/books";

export default function DeleteBookButton({
  bookId,
  bookTitle,
}: {
  bookId: string;
  bookTitle: string;
}) {
  return (
    <form
      action={deleteBook.bind(null, bookId)}
      onSubmit={(event) => {
        if (!confirm(`Yakin ingin menghapus permanen "${bookTitle}"?`)) {
          event.preventDefault();
        }
      }}
    >
      <button className="btn-danger">Hapus </button>
    </form>
  );
}
