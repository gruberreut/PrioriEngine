import { useId } from "react";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled = false }: CheckboxProps) {
  const id = useId();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      />
      {label !== undefined && (
        <label
          htmlFor={id}
          style={{ fontSize: "14px", fontWeight: 500, color: disabled ? "#9CA3AF" : "#374151", cursor: disabled ? "not-allowed" : "pointer" }}
        >
          {label}
        </label>
      )}
    </div>
  );
}
