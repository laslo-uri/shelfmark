import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CommandPalette } from "@/features/command/CommandPalette";
import { renderApp } from "@/test/render";

describe("CommandPalette", () => {
  it("runs Add book", async () => {
    const user = userEvent.setup();
    const onAddBook = vi.fn();
    renderApp(
      <CommandPalette
        open
        detailOpen={false}
        onClose={() => {}}
        onAddBook={onAddBook}
        onScan={() => {}}
        onToggleTheme={() => {}}
        onSearch={() => {}}
        onFilter={() => {}}
        onSort={() => {}}
        onExport={() => {}}
        onImport={() => {}}
      />,
    );
    expect(screen.getByText("Add book")).toBeInTheDocument();
    await user.click(screen.getByText("Add book"));
    expect(onAddBook).toHaveBeenCalledOnce();
  });
});
