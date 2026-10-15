import { fireEvent, screen } from "@testing-library/react";
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
    expect(screen.getByRole("img", { name: "Rated 4 of 5" })).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByText("Unread")).toBeInTheDocument();
  });

  it("falls back to the title tile when the cover fails to load", () => {
    const { container } = renderApp(<BookCard book={{ ...book, coverUrl: "https://example.com/missing.jpg" }} onOpen={vi.fn()} />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("loading", "lazy");
    fireEvent.error(img!);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getAllByText("Dune").length).toBeGreaterThan(1);
  });
});
