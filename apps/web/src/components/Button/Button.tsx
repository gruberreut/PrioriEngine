import type { ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "icon";

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  /** "submit" relies on the enclosing <form>'s onSubmit rather than onClick -
   *  needed for the form-submit-button call site. */
  type?: "button" | "submit";
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  destructive: styles.destructive,
};

// "md" carries no modifier class - its metrics are the base .button rule's
// defaults, since it's the button's own default size.
const sizeClass: Record<ButtonSize, string> = {
  sm: styles.sm,
  md: "",
  icon: styles.icon,
};

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  loading = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        styles.button,
        variantClass[variant],
        sizeClass[size],
        block ? styles.block : "",
        loading ? styles.loading : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.label}>{children}</span>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
    </button>
  );
}
