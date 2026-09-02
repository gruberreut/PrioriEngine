import { LocationIcon, LOCATION_LABELS, type LocationRequirement } from "../LocationIcon/LocationIcon";
import { Chip } from "../../../components/Chip/Chip";
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
          <Chip
            key={loc}
            label={LOCATION_LABELS[loc]}
            icon={<LocationIcon location={loc} size={16} />}
            selected={value === loc}
            onClick={() => onChange(value === loc ? undefined : loc)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
