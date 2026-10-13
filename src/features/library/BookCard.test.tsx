import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Book } from "@/types";
import { BookCard } from "@/features/library/BookCard";
import { renderApp } from "@/test/render";

const book: Book = {
  id: 1,
  isbn: "9780306406157",
  title: "Dune",
  authors: ["Frank Herbert"],
  publisher: "",
  publishDate: "",
  description: "",
  coverUrl: "",
  notes: "",
  status: "unread",
  rating: 4,
  tags: [],
  addedAt: 1,
};

describe("BookCard", () => {
  it("shows the title, author, and rating", () => {
    renderApp(<BookCard book={book} onOpen={vi.fn()} />);
    expect(screen.getAllByText("Dune").length).toBeGreaterThan(0);
    expect(screen.getByText("Frank Herbert")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "4 stars" })).toHaveAttribute("aria-checked", "true");
  });
});
