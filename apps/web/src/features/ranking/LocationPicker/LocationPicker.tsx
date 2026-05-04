import { LocationIcon, LOCATION_LABELS, type LocationRequirement } from "../LocationIcon/LocationIcon";
import styles from "./LocationPicker.module.css";

export type { LocationRequirement };

const LOCATIONS: LocationRequirement[] = ["home", "in-person", "anywhere"];

export interface LocationPickerProps {
  value: LocationRequirement | undefined;
  onChange: (value: LocationRequirement | undefined) => void;
  label?: string;
  disabled?: boolean;
}

export function LocationPicker({ value, onChange, label, disabled = false }: LocationPickerProps) {
  return (
    <div className={styles.container}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.group} role="group" aria-label={label ?? "Location"}>
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => onChange(value === loc ? undefined : loc)}
            disabled={disabled}
            aria-pressed={value === loc}
            className={`${styles.button} ${value === loc ? styles.selected : ""}`}
          >
            <LocationIcon location={loc} size={20} />
            <span className={styles.levelLabel}>{LOCATION_LABELS[loc]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
