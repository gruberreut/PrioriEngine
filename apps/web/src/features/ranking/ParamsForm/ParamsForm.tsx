import { useState } from "react";
import { Select } from "../../../components/Select/Select";
import { Checkbox } from "../../../components/Checkbox/Checkbox";

export type EnergyLevel = "low" | "medium" | "high";

export interface RankParams {
  context: string | undefined;
  availableTime: number;
  energy: EnergyLevel;
  explain: boolean;
}

export interface ParamsFormProps {
  contexts: string[];
  onSubmit: (params: RankParams) => void;
  loading?: boolean;
}

const AVAILABLE_TIME_OPTIONS = [
  { label: "10 min", value: "10" },
  { label: "15 min", value: "15" },
  { label: "30 min", value: "30" },
  { label: "60 min", value: "60" },
];

const ENERGY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

export function ParamsForm({ contexts, onSubmit, loading = false }: ParamsFormProps) {
  const [context, setContext] = useState<string | undefined>(undefined);
  const [availableTime, setAvailableTime] = useState(30);
  const [energy, setEnergy] = useState<EnergyLevel>("medium");
  const [explain, setExplain] = useState(false);

  const contextOptions = contexts.map((c) => ({ label: c, value: c }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ context, availableTime, energy, explain });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Select
        label="Context"
        options={contextOptions}
        value={context}
        onChange={setContext}
        placeholder="All"
        disabled={loading}
      />
      <Select
        label="Available Time"
        options={AVAILABLE_TIME_OPTIONS}
        value={availableTime.toString()}
        onChange={(val) => setAvailableTime(val !== undefined ? Number(val) : 30)}
        disabled={loading}
      />
      <Select
        label="Energy"
        options={ENERGY_OPTIONS}
        value={energy}
        onChange={(val) => setEnergy((val ?? "medium") as EnergyLevel)}
        disabled={loading}
      />
      <Checkbox
        label="Show score breakdown"
        checked={explain}
        onChange={setExplain}
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: 500,
          backgroundColor: loading ? "#9CA3AF" : "#4F46E5",
          color: "#FFFFFF",
          border: "none",
          borderRadius: "6px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Ranking…" : "Rank"}
      </button>
    </form>
  );
}
