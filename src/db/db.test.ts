import { beforeEach, describe, expect, it } from "vitest";
import { addBook, db, exportLibrary, getAllBooks, importLibrary, removeBook, restoreBook, updateBook } from "@/db/db";

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

  it("does not create two copies when the same book is added concurrently", async () => {
    const results = await Promise.allSettled([addBook(sample), addBook(sample)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await getAllBooks()).toHaveLength(1);
  });

  it("sanitizes imported records and reports what happened", async () => {
    await addBook({ ...sample, notes: "keep me" });
    const result = await importLibrary({
      books: [
        { ...sample, title: "Ignored on merge", notes: "other" },
        { isbn: "0-306-40615-2", title: "Same book as ISBN-10" },
        { isbn: "9780141439518", title: "Pride and Prejudice", authors: "Jane Austen", rating: 99, status: "bogus", coverUrl: "javascript:alert(1)", tags: "classic" },
        { title: "No ISBN" },
        "garbage",
      ],
    });
    expect(result).toEqual({ added: 1, updated: 0, skipped: 4 });
    const books = await getAllBooks();
    expect(books).toHaveLength(2);
    const pride = books.find((book) => book.isbn === "9780141439518");
    expect(pride).toMatchObject({ authors: ["Jane Austen"], rating: 5, status: "unread", coverUrl: "", tags: ["classic"] });
    expect(books.find((book) => book.isbn === sample.isbn)?.notes).toBe("keep me");
  });

  it("guards updates and restores a removed book with its id", async () => {
    const id = await addBook(sample);
    await updateBook(id, { coverUrl: "javascript:alert(1)", rating: 12 });
    const [book] = await getAllBooks();
    expect(book).toMatchObject({ coverUrl: "", rating: 5 });
    await removeBook(id);
    await restoreBook(book!);
    expect((await getAllBooks())[0]?.id).toBe(id);
  });
});
