import type { Theme } from "../../features/theme/useTheme";
import styles from "./ThemeToggle.module.css";

export interface ThemeToggleProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "auto", label: "Auto" },
  { value: "dark", label: "Dark" },
];

export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  return (
    <div className={styles.group} role="group" aria-label="Color theme">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={theme === value}
          className={`${styles.button} ${theme === value ? styles.selected : ""}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
