import { useState, useEffect, useRef } from "react";
import { Select } from "../../../components/Select/Select";
import { Checkbox } from "../../../components/Checkbox/Checkbox";
import { EnergyPicker, type EnergyLevel } from "../EnergyPicker/EnergyPicker";
import { LocationPicker } from "../LocationPicker/LocationPicker";
import { DurationPicker } from "../../tasks/DurationPicker/DurationPicker";
import styles from "./ParamsForm.module.css";

export type { EnergyLevel };

export interface RankParams {
  context: string | undefined;
  location: "home" | "in-person" | "anywhere" | undefined;
  availableTime: number;
  energy: EnergyLevel;
  explain: boolean;
}

export interface ParamsFormProps {
  contexts: string[];
  onParamsChange: (params: RankParams) => void;
  disabled?: boolean;
}

export function ParamsForm({ contexts, onParamsChange, disabled = false }: ParamsFormProps) {
  const [context, setContext] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<RankParams["location"]>(undefined);
  const [availableTime, setAvailableTime] = useState(30);
  const [energy, setEnergy] = useState<EnergyLevel>("medium");
  const [explain, setExplain] = useState(false);

  const paramsRef = useRef<RankParams>({ context, location, availableTime, energy, explain });

  useEffect(() => {
    const params = { context, location, availableTime, energy, explain };
    paramsRef.current = params;
    onParamsChange(params);
  }, [context, location, availableTime, energy, explain]);

  const contextOptions = contexts.map((c) => ({ label: c, value: c }));

  return (
    <div className={styles.form}>
      <Select
        label="Context"
        options={contextOptions}
        value={context}
        onChange={setContext}
        placeholder="All"
        disabled={disabled}
      />
      <LocationPicker
        label="Location"
        value={location}
        onChange={setLocation}
        disabled={disabled}
      />
      <DurationPicker
        label="Available Time"
        value={availableTime}
        onChange={setAvailableTime}
        disabled={disabled}
      />
      <EnergyPicker
        label="Energy"
        value={energy}
        onChange={setEnergy}
        disabled={disabled}
      />
      <Checkbox
        label="Show score breakdown"
        checked={explain}
        onChange={setExplain}
        disabled={disabled}
      />
    </div>
  );
}
