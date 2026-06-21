import { useState, useEffect, useRef } from "react";
import { Checkbox } from "../../../components/Checkbox/Checkbox";
import { EnergyPicker, type EnergyLevel } from "../EnergyPicker/EnergyPicker";
import { LocationPicker } from "../LocationPicker/LocationPicker";
import { DurationPicker } from "../../tasks/DurationPicker/DurationPicker";
import styles from "./ParamsForm.module.css";

export type { EnergyLevel };

export interface RankParams {
  location: "home" | "in-person" | "anywhere" | undefined;
  availableTime: number;
  energy: EnergyLevel;
  explain: boolean;
}

export interface ParamsFormProps {
  onParamsChange: (params: RankParams) => void;
  disabled?: boolean;
}

export function ParamsForm({ onParamsChange, disabled = false }: ParamsFormProps) {
  const [location, setLocation] = useState<RankParams["location"]>(undefined);
  const [availableTime, setAvailableTime] = useState(30);
  const [energy, setEnergy] = useState<EnergyLevel>("medium");
  const [explain, setExplain] = useState(false);

  const paramsRef = useRef<RankParams>({ location, availableTime, energy, explain });

  useEffect(() => {
    const params = { location, availableTime, energy, explain };
    paramsRef.current = params;
    onParamsChange(params);
  }, [location, availableTime, energy, explain]);

  return (
    <div className={styles.form}>
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
