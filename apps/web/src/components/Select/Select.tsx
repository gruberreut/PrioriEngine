import { useId } from "react";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

export function Select({ options, value, onChange, label, placeholder, disabled = false }: SelectProps) {
  const id = useId();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label htmlFor={id} style={{ fontSize: "14px", fontWeight: 500, color: "#374151" }}>
        {label}
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
        disabled={disabled}
        style={{
          padding: "8px 12px",
          fontSize: "14px",
          border: "1px solid #D1D5DB",
          borderRadius: "6px",
          backgroundColor: disabled ? "#F9FAFB" : "#FFFFFF",
          color: disabled ? "#9CA3AF" : "#111827",
          cursor: disabled ? "not-allowed" : "pointer",
          appearance: "auto",
          minWidth: "160px",
        }}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
