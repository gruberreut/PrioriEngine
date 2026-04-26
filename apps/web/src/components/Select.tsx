export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

export function Select({ options, value, onChange, label, disabled = false }: SelectProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "14px", fontWeight: 500, color: "#374151" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
