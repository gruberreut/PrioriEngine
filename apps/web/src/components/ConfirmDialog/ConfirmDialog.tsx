import { useEffect, useRef } from "react";
import { Card } from "../Card/Card";
import { Button, type ButtonVariant } from "../Button/Button";
import styles from "./ConfirmDialog.module.css";

export interface ConfirmDialogOption {
  label: string;
  value: string;
  variant?: ButtonVariant;
}

export interface ConfirmDialogProps {
  open: boolean;
  kicker?: string;
  title: string;
  description?: string;
  options: ConfirmDialogOption[];
  onSelect: (value: string) => void;
  onCancel?: () => void;
}

export function ConfirmDialog({
  open,
  kicker,
  title,
  description,
  options,
  onSelect,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel?.();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div
        ref={panelRef}
        className={styles.panelWrap}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <Card kicker={kicker} title={title} meta={description} active>
          <div className={styles.actions}>
            {options.map((option) => (
              <Button
                key={option.value}
                variant={option.variant ?? "secondary"}
                size="sm"
                onClick={() => onSelect(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
