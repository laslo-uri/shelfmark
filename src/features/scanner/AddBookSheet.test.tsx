import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddBookSheet } from "@/features/scanner/AddBookSheet";
import { renderApp } from "@/test/render";

describe("AddBookSheet", () => {
  it("shows an ISBN field and does not save an invalid number", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderApp(
      <AddBookSheet open onClose={() => {}} onSave={onSave} existingIsbns={new Set()} />,
    );
    const input = screen.getByLabelText("ISBN");
    await user.type(input, "nope");
    await user.click(screen.getByRole("button", { name: "Look up" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid isbn/i);
    expect(onSave).not.toHaveBeenCalled();
  });
});
