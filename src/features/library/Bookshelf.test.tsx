import { fireEvent, screen } from "@testing-library/react";
import { createRef } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { addBook, db } from "@/db/db";
import { Bookshelf, type ShelfActions } from "@/features/library/Bookshelf";
import { renderApp } from "@/test/render";

beforeEach(async () => {
  await db.books.clear();
});

describe("Bookshelf", () => {
  it("offers a way to add a book when the shelf is empty", async () => {
    renderApp(
      <Bookshelf actionsRef={createRef<ShelfActions | null>()} addOpen={false} onAddOpenChange={() => {}} />,
    );
    expect(await screen.findByRole("button", { name: /add a book/i })).toBeInTheDocument();
  });

  it("shows a saved title", async () => {
    await addBook({
      isbn: "9780306406157",
      title: "Dune",
      authors: ["Frank Herbert"],
      coverUrl: "",
      publisher: "",
      publishDate: "",
      description: "",
    });
    renderApp(
      <Bookshelf actionsRef={createRef<ShelfActions | null>()} addOpen={false} onAddOpenChange={() => {}} />,
    );
    expect((await screen.findAllByText("Dune")).length).toBeGreaterThan(0);
  });

  it("offers a lookup when the search is an ISBN", async () => {
    await addBook({
      isbn: "9780306406157",
      title: "Dune",
      authors: ["Frank Herbert"],
      coverUrl: "",
      publisher: "",
      publishDate: "",
      description: "",
    });
    renderApp(
      <Bookshelf actionsRef={createRef<ShelfActions | null>()} addOpen={false} onAddOpenChange={() => {}} />,
    );
    const [search] = await screen.findAllByLabelText("Search library");
    fireEvent.change(search!, { target: { value: "9780306406157" } });
    expect(screen.getAllByRole("button", { name: "Look up ISBN" }).length).toBeGreaterThan(0);
  });
});
