import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";

export interface FailureDialogProps {
  open: boolean;
  onConfirm: () => void;
}

const OPTIONS = [{ label: "OK", value: "ok", variant: "primary" as const }];

// The app's one dialog for a failed backend call (tasks/TASKS-TECH.md § 31).
// OK and dismissing both call onConfirm: either way the data is refreshed.
export function FailureDialog({ open, onConfirm }: FailureDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Something went wrong"
      description="Your last change couldn't be saved. The page will refresh."
      options={OPTIONS}
      onSelect={onConfirm}
      onCancel={onConfirm}
    />
  );
}
