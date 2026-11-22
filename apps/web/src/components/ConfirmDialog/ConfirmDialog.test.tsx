// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog, type ConfirmDialogProps } from "./ConfirmDialog";

const defaultProps: ConfirmDialogProps = {
  open: true,
  title: "Delete task?",
  options: [
    { label: "Cancel", value: "cancel" },
    { label: "Delete", value: "delete", variant: "destructive" },
  ],
  onSelect: () => {},
};

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("calls onSelect with the clicked option's value", async () => {
    const onSelect = vi.fn();
    render(<ConfirmDialog {...defaultProps} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith("delete");
  });

  it("calls onCancel on Escape", async () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

    await userEvent.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("stops listening for Escape once closed", async () => {
    const onCancel = vi.fn();
    const { rerender } = render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    rerender(<ConfirmDialog {...defaultProps} open={false} onCancel={onCancel} />);

    await userEvent.keyboard("{Escape}");

    expect(onCancel).not.toHaveBeenCalled();
  });
});
