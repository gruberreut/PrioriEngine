import { useState } from "react";
import { Select } from "../../../components/Select/Select";
import { Checkbox } from "../../../components/Checkbox/Checkbox";
import { EnergyPicker, type EnergyLevel } from "../../../components/EnergyPicker/EnergyPicker";
import styles from "./ParamsForm.module.css";

export type { EnergyLevel };

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
    <form onSubmit={handleSubmit} className={styles.form}>
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
      <EnergyPicker
        label="Energy"
        value={energy}
        onChange={setEnergy}
        disabled={loading}
      />
      <Checkbox
        label="Show score breakdown"
        checked={explain}
        onChange={setExplain}
        disabled={loading}
      />
      <button type="submit" disabled={loading} className={styles.button}>
        {loading ? "Ranking…" : "Rank"}
      </button>
    </form>
  );
}
