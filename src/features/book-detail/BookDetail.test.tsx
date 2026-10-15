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

  it("keeps unsaved notes when the stored book refreshes", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn(async () => undefined);
    const { rerender } = renderApp(<BookDetail layout="inspector" book={book} onClose={() => {}} onUpdate={onUpdate} onRemove={async () => undefined} />);
    await user.type(screen.getByLabelText("Notes"), "half-written");
    // A refetch after saving a rating hands back equal values in fresh arrays.
    rerender(<BookDetail layout="inspector" book={{ ...book, authors: [...book.authors], rating: 3 }} onClose={() => {}} onUpdate={onUpdate} onRemove={async () => undefined} />);
    expect(screen.getByLabelText("Notes")).toHaveValue("half-written");
  });

  it("autosaves the previous book's edits when switching books", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn(async () => undefined);
    const { rerender } = renderApp(<BookDetail layout="inspector" book={book} onClose={() => {}} onUpdate={onUpdate} onRemove={async () => undefined} />);
    await user.type(screen.getByLabelText("Notes"), "great");
    rerender(<BookDetail layout="inspector" book={{ ...book, id: 8, title: "Emma", notes: "" }} onClose={() => {}} onUpdate={onUpdate} onRemove={async () => undefined} />);
    expect(onUpdate).toHaveBeenCalledWith(7, expect.objectContaining({ notes: "great", title: "Dune" }));
    expect(onUpdate).not.toHaveBeenCalledWith(8, expect.anything());
    expect(screen.getByLabelText("Notes")).toHaveValue("");
  });

  it("removes a tag and refuses an unsafe cover URL", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn(async () => undefined);
    renderApp(<BookDetail layout="inspector" book={{ ...book, tags: ["sf", "classic"] }} onClose={() => {}} onUpdate={onUpdate} onRemove={async () => undefined} />);
    await user.click(screen.getByRole("button", { name: "Remove tag sf" }));
    expect(onUpdate).toHaveBeenCalledWith(7, { tags: ["classic"] });
    onUpdate.mockClear();
    await user.type(screen.getByLabelText("Cover URL"), "javascript:alert(1)");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/cover url/i);
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
