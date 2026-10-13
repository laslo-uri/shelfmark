import { describe, expect, it } from "vitest";
import { lookupIsbn, mergeBooks } from "@/api/bookLookup";
import { coverUrl } from "@/lib/isbn";

const isbn = "9780306406157";

describe("mergeBooks", () => {
  it("discards junk titles", () => {
    const book = mergeBooks([{ isbn, title: "Just a moment", authors: [], publisher: "", publishDate: "", description: "", coverUrl: "" }], isbn);
    expect(book.title).toBe("");
    expect(book.coverUrl).toBe(coverUrl(isbn));
  });

  it("keeps the higher score and fills missing authors", () => {
    const book = mergeBooks([
      { isbn, title: "Dune", authors: [], publisher: "Ace", publishDate: "1965", description: "", coverUrl: coverUrl(isbn) },
      { isbn, title: "Dune", authors: ["Frank Herbert"], publisher: "", publishDate: "", description: "Spice", coverUrl: "https://covers.example/dune.jpg" },
    ], isbn);
    expect(book.authors).toEqual(["Frank Herbert"]);
    expect(book.publisher).toBe("Ace");
    expect(book.description).toBe("Spice");
    expect(book.coverUrl).toBe("https://covers.example/dune.jpg");
  });

  it("returns an empty book when nothing matches", () => {
    const book = mergeBooks([null, null], isbn);
    expect(book.isbn).toBe(isbn);
    expect(book.coverUrl).toBe(coverUrl(isbn));
  });
});

describe("lookupIsbn", () => {
  it("rejects an invalid ISBN before fetching", async () => {
    await expect(lookupIsbn("nope")).rejects.toThrow("Invalid ISBN");
  });
});
