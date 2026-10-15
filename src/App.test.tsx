import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/App";
import { addBook, db } from "@/db/db";
import { renderApp } from "@/test/render";

beforeEach(async () => {
  await db.books.clear();
  localStorage.clear();
});

describe("App shortcuts", () => {
  it("closes the command palette on Escape before closing the open book", async () => {
    await addBook({ isbn: "9780306406157", title: "Dune", authors: ["Frank Herbert"] });
    renderApp(<App />);
    const [card] = await screen.findAllByRole("button", { name: /dune/i });
    fireEvent.click(card!);
    expect(await screen.findByLabelText("Notes")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const palette = await screen.findByRole("dialog", { name: "Command palette" });
    expect(within(palette).getByText("Delete book")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Command palette" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByLabelText("Notes")).not.toBeInTheDocument();
  });

  it("lets a palette delete be undone", async () => {
    await addBook({ isbn: "9780306406157", title: "Dune", authors: ["Frank Herbert"] });
    renderApp(<App />);
    const [card] = await screen.findAllByRole("button", { name: /dune/i });
    fireEvent.click(card!);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const palette = await screen.findByRole("dialog", { name: "Command palette" });
    fireEvent.click(within(palette).getByText("Delete book"));

    const undo = await screen.findByRole("button", { name: "Undo" });
    expect(await db.books.count()).toBe(0);
    fireEvent.click(undo);
    await vi.waitFor(async () => expect(await db.books.count()).toBe(1));
    expect((await db.books.toArray())[0]?.title).toBe("Dune");
  });
});
