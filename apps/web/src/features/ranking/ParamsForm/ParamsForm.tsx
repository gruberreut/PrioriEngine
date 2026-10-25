import { useState, useEffect, useEffectEvent, useRef } from "react";
import { Checkbox } from "../../../components/Checkbox/Checkbox";
import { Card } from "../../../components/Card/Card";
import { EnergyPicker, type EnergyLevel } from "../EnergyPicker/EnergyPicker";
import { LocationPicker } from "../LocationPicker/LocationPicker";
import { DurationPicker } from "../../tasks/DurationPicker/DurationPicker";
import { getGreeting } from "./getGreeting";
import styles from "./ParamsForm.module.css";

export type { EnergyLevel };

export interface RankParams {
  location: "home" | "in-person" | "anywhere";
  availableTime: number;
  energy: EnergyLevel;
  explain: boolean;
}

export interface ParamsFormProps {
  onParamsChange: (params: RankParams) => void;
  disabled?: boolean;
}

export function ParamsForm({ onParamsChange, disabled = false }: ParamsFormProps) {
  const [location, setLocation] = useState<RankParams["location"]>("home");
  const [availableTime, setAvailableTime] = useState(30);
  const [energy, setEnergy] = useState<EnergyLevel>("medium");
  const [explain, setExplain] = useState(false);

  const paramsRef = useRef<RankParams>({ location, availableTime, energy, explain });

  // Fires on param changes only, not when the parent passes a new callback.
  const notifyParamsChange = useEffectEvent((params: RankParams) => {
    onParamsChange(params);
  });

  useEffect(() => {
    const params = { location, availableTime, energy, explain };
    paramsRef.current = params;
    notifyParamsChange(params);
  }, [location, availableTime, energy, explain]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>{getGreeting()}</h1>
        <p className={styles.subtitle}>Set what fits right now, then swipe.</p>
      </div>

      <Card>
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Location</span>
          <LocationPicker value={location} onChange={setLocation} disabled={disabled} />
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Available Time</span>
          <DurationPicker value={availableTime} onChange={setAvailableTime} disabled={disabled} />
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Energy</span>
          <EnergyPicker value={energy} onChange={setEnergy} disabled={disabled} />
        </div>
      </Card>

      <Checkbox
        label="Show score breakdown"
        checked={explain}
        onChange={setExplain}
        disabled={disabled}
      />
    </div>
  );
}
