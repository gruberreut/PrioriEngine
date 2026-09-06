import { LocationIcon, LOCATION_LABELS, type LocationRequirement } from "../LocationIcon/LocationIcon";
import { SplitGroup } from "../../../components/SplitGroup/SplitGroup";
import styles from "./LocationPicker.module.css";

export type { LocationRequirement };

const LOCATIONS: LocationRequirement[] = ["home", "in-person", "anywhere"];

export interface LocationPickerProps {
  value: LocationRequirement;
  onChange: (value: LocationRequirement) => void;
  label?: string;
  disabled?: boolean;
}

export function LocationPicker({ value, onChange, label, disabled = false }: LocationPickerProps) {
  const options = LOCATIONS.map((loc) => ({
    value: loc,
    label: LOCATION_LABELS[loc],
    icon: <LocationIcon location={loc} size={20} />,
  }));

  return (
    <div className={styles.container}>
      {label && <span className={styles.label}>{label}</span>}
      <SplitGroup options={options} value={value} onChange={onChange} label={label ?? "Location"} disabled={disabled} />
    </div>
  );
}
