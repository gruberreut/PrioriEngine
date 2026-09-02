import { useId } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import styles from "./TextInput.module.css";

interface FieldChromeProps {
  label: string;
  hideLabel?: boolean;
  help?: string;
  error?: string;
  renderControl: (a11y: { id: string; describedBy: string | undefined }) => ReactNode;
}

function FieldChrome({ label, hideLabel = false, help, error, renderControl }: FieldChromeProps) {
  const id = useId();
  const message = error ?? help;
  const messageId = message ? `${id}-message` : undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={[styles.label, hideLabel ? "sr-only" : ""].filter(Boolean).join(" ")}>
        {label}
      </label>
      {renderControl({ id, describedBy: messageId })}
      {message && (
        <span id={messageId} className={[styles.help, error ? styles.helpError : ""].filter(Boolean).join(" ")}>
          {message}
        </span>
      )}
    </div>
  );
}

export interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  help?: string;
  error?: string;
  hideLabel?: boolean;
  type?: "text" | "email" | "date" | "number";
  autoFocus?: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  help,
  error,
  hideLabel,
  type = "text",
  autoFocus,
  onKeyDown,
}: TextInputProps) {
  return (
    <FieldChrome
      label={label}
      hideLabel={hideLabel}
      help={help}
      error={error}
      renderControl={({ id, describedBy }) => (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[styles.control, error ? styles.controlError : ""].filter(Boolean).join(" ")}
        />
      )}
    />
  );
}

export interface TextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  help?: string;
  error?: string;
  hideLabel?: boolean;
  rows?: number;
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  help,
  error,
  hideLabel,
  rows,
}: TextareaProps) {
  return (
    <FieldChrome
      label={label}
      hideLabel={hideLabel}
      help={help}
      error={error}
      renderControl={({ id, describedBy }) => (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[styles.control, styles.textarea, error ? styles.controlError : ""].filter(Boolean).join(" ")}
        />
      )}
    />
  );
}
