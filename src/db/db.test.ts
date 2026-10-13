import { beforeEach, describe, expect, it } from "vitest";
import { addBook, db, exportLibrary, getAllBooks, importLibrary, removeBook, updateBook } from "@/db/db";

const sample = {
  isbn: "9780306406157",
  title: "Dune",
  authors: ["Frank Herbert"],
  publisher: "",
  publishDate: "",
  description: "",
  coverUrl: "",
};

beforeEach(async () => {
  await db.books.clear();
});

describe("books", () => {
  it("adds, updates, and removes a book", async () => {
    const id = await addBook(sample);
    await updateBook(id, { rating: 5 });
    expect((await getAllBooks())[0]?.rating).toBe(5);
    await removeBook(id);
    expect(await getAllBooks()).toHaveLength(0);
  });

  it("rejects a duplicate ISBN", async () => {
    await addBook(sample);
    await expect(addBook(sample)).rejects.toMatchObject({ code: "DUPLICATE" });
  });

  it("merges notes onto an existing book and replaces the shelf", async () => {
    const id = await addBook({ ...sample, notes: "" });
    await importLibrary({
      books: [{ ...sample, notes: "from backup", addedAt: 1, status: "unread", rating: 0, tags: [] }],
    });
    expect(await getAllBooks()).toHaveLength(1);
    expect((await getAllBooks())[0]?.notes).toBe("from backup");

    await importLibrary({ books: [{ ...sample, title: "Replacement", notes: "" }] }, { replace: true });
    const books = await getAllBooks();
    expect(books).toHaveLength(1);
    expect(books[0]?.title).toBe("Replacement");
    expect(books[0]?.id).not.toBe(id);
    expect((await exportLibrary()).version).toBe(1);
  });
});
