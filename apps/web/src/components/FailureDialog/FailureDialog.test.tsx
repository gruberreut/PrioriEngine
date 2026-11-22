// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FailureDialog } from "./FailureDialog";

describe("FailureDialog", () => {
  it("calls onConfirm on OK", async () => {
    const onConfirm = vi.fn();
    render(<FailureDialog open onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole("button", { name: "OK" }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onConfirm on Escape", async () => {
    const onConfirm = vi.fn();
    render(<FailureDialog open onConfirm={onConfirm} />);

    await userEvent.keyboard("{Escape}");

    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
