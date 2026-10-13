import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Book } from "@/types";
import { BookDetail } from "@/features/book-detail/BookDetail";
import { renderApp } from "@/test/render";

const book: Book = {
  id: 7,
  isbn: "9780306406157",
  title: "Dune",
  authors: ["Frank Herbert"],
  publisher: "",
  publishDate: "",
  description: "",
  coverUrl: "",
  notes: "",
  status: "unread",
  rating: 0,
  tags: [],
  addedAt: 1,
};

describe("BookDetail", () => {
  it("changes status", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn(async () => undefined);
    renderApp(<BookDetail book={book} onClose={() => {}} onUpdate={onUpdate} onRemove={async () => undefined} />);
    expect(screen.getByDisplayValue("Dune")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Reading" }));
    expect(onUpdate).toHaveBeenCalledWith(7, { status: "reading" });
  });
});
