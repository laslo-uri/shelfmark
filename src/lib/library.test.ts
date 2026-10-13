import { describe, expect, it } from "vitest";
import { filterAndSortBooks } from "@/lib/library";

const books = [
  { id: 1, title: "Dune", authors: ["Frank Herbert"], isbn: "9780441172719", addedAt: 2, status: "read", rating: 5, tags: ["sci-fi"], notes: "" },
  { id: 2, title: "Arrival", authors: ["Ted Chiang"], isbn: "9781101972120", addedAt: 3, status: "reading", rating: 4, tags: ["short"], notes: "lent" },
  { id: 3, title: "Babel", authors: ["R.F. Kuang"], isbn: "9780063021426", addedAt: 1, status: "unread", rating: 0, tags: ["sci-fi"], notes: "" },
];

describe("filterAndSortBooks", () => {
  it("filters by status and tag", () => {
    const result = filterAndSortBooks(books, { status: "read", tag: "sci-fi" });
    expect(result.map((book) => book.id)).toEqual([1]);
  });

  it("sorts by title", () => {
    const result = filterAndSortBooks(books, { sort: "title" });
    expect(result.map((book) => book.title)).toEqual(["Arrival", "Babel", "Dune"]);
  });

  it("searches notes and tags", () => {
    expect(filterAndSortBooks(books, { query: "lent" })).toHaveLength(1);
    expect(filterAndSortBooks(books, { query: "short" })).toHaveLength(1);
  });

  it("sorts by rating and keeps every book when the query is empty", () => {
    const result = filterAndSortBooks(books, { query: "", sort: "rating" });
    expect(result.map((book) => book.title)).toEqual(["Dune", "Arrival", "Babel"]);
  });
});
