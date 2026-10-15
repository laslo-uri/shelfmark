import { describe, expect, it } from "vitest";
import { normalizeIsbn, normalizeRating, parseLibraryText, safeCoverUrl, sanitizeBook } from "@/lib/bookData";

describe("safeCoverUrl", () => {
  it("keeps web and inline image URLs", () => {
    expect(safeCoverUrl("https://covers.openlibrary.org/b/id/1-M.jpg")).toBe("https://covers.openlibrary.org/b/id/1-M.jpg");
    expect(safeCoverUrl("data:image/jpeg;base64,AAAA")).toBe("data:image/jpeg;base64,AAAA");
  });

  it("drops script and non-image schemes", () => {
    expect(safeCoverUrl("javascript:alert(1)")).toBe("");
    expect(safeCoverUrl("data:text/html;base64,PHNjcmlwdD4=")).toBe("");
    expect(safeCoverUrl("file:///etc/passwd")).toBe("");
    expect(safeCoverUrl("not a url")).toBe("");
    expect(safeCoverUrl(42)).toBe("");
  });
});

describe("sanitizeBook", () => {
  it("fills defaults and coerces bad field types", () => {
    const book = sanitizeBook(
      { isbn: "0-306-40615-2", title: "  Dune ", authors: "Frank Herbert, ", tags: [1, "sf", "sf", null], rating: "9", status: "lost", coverUrl: "javascript:x", addedAt: "2020-01-01" },
      5,
    );
    expect(book).toEqual({
      isbn: "9780306406157",
      title: "Dune",
      authors: ["Frank Herbert"],
      publisher: "",
      publishDate: "",
      description: "",
      coverUrl: "",
      notes: "",
      status: "unread",
      rating: 5,
      tags: ["1", "sf"],
      addedAt: Date.parse("2020-01-01"),
    });
  });

  it("rejects records without an ISBN", () => {
    expect(sanitizeBook({ title: "No ISBN" })).toBeNull();
    expect(sanitizeBook(null)).toBeNull();
    expect(sanitizeBook(["9780306406157"])).toBeNull();
  });

  it("clamps ratings and keeps unknown identifiers compact", () => {
    expect(normalizeRating(-3)).toBe(0);
    expect(normalizeRating("abc")).toBe(0);
    expect(normalizeIsbn(" 123 45 ")).toBe("12345");
  });
});

describe("parseLibraryText", () => {
  it("accepts an export object or a bare array", () => {
    expect(parseLibraryText('{"version":1,"books":[{"isbn":"1"}]}').books).toHaveLength(1);
    expect(parseLibraryText('[{"isbn":"1"},{"isbn":"2"}]').books).toHaveLength(2);
  });

  it("rejects malformed files with a readable error", () => {
    expect(() => parseLibraryText("{nope")).toThrow("Invalid library file.");
    expect(() => parseLibraryText('{"books":"x"}')).toThrow("Invalid library file.");
    expect(() => parseLibraryText("null")).toThrow("Invalid library file.");
  });
});
