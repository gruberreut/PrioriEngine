import { LocationIcon, LOCATION_LABELS, type LocationRequirement } from "../LocationIcon/LocationIcon";
import { EnergyIcon, type EnergyLevel } from "../EnergyIcon/EnergyIcon";
import styles from "./ParamsBar.module.css";

export interface ParamsBarProps {
  location: LocationRequirement;
  availableTime: number;
  energy: EnergyLevel;
}

export function ParamsBar({ location, availableTime, energy }: ParamsBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.column}>
        <span className={styles.caption}>Location</span>
        <div className={styles.value}>
          <LocationIcon location={location} />
          <span>{LOCATION_LABELS[location]}</span>
        </div>
      </div>

      <div className={styles.column}>
        <span className={styles.caption}>Time</span>
        <div className={styles.value}>
          <span>{availableTime} min</span>
        </div>
      </div>

      <div className={styles.column}>
        <span className={styles.caption}>Energy</span>
        <div className={styles.value}>
          <EnergyIcon level={energy} />
          <span className={styles.energyValue}>{energy}</span>
        </div>
      </div>
    </div>
  );
}
