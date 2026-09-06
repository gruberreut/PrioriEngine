import { useState } from "react";
import { Sheet } from "../../../components/Sheet/Sheet";
import { LocationIcon, LOCATION_LABELS, type LocationRequirement } from "../LocationIcon/LocationIcon";
import { EnergyIcon, type EnergyLevel } from "../EnergyIcon/EnergyIcon";
import { LocationPicker } from "../LocationPicker/LocationPicker";
import { EnergyPicker } from "../EnergyPicker/EnergyPicker";
import { DurationPicker } from "../../tasks/DurationPicker/DurationPicker";
import styles from "./ParamsBar.module.css";

type ParamsBarField = "location" | "time" | "energy";

export interface ParamsBarProps {
  location: LocationRequirement;
  availableTime: number;
  energy: EnergyLevel;
  onLocationChange: (value: LocationRequirement) => void;
  onAvailableTimeChange: (value: number) => void;
  onEnergyChange: (value: EnergyLevel) => void;
  /** Kept mounted rather than conditionally rendered even while not visible
   *  (e.g. on the params slide itself), so RankingPage's layout height
   *  stays constant across slides instead of jumping by the bar's own
   *  height as it mounts/unmounts. `visibility: hidden` still fully drops
   *  it from the focus order and the accessibility tree. */
  visible?: boolean;
}

export function ParamsBar({
  location,
  availableTime,
  energy,
  onLocationChange,
  onAvailableTimeChange,
  onEnergyChange,
  visible = true,
}: ParamsBarProps) {
  const [openField, setOpenField] = useState<ParamsBarField | null>(null);

  function closeSheet() {
    setOpenField(null);
  }

  function columnClass(field: ParamsBarField) {
    return `${styles.column} ${openField === field ? styles.active : ""}`;
  }

  return (
    <>
      <div className={`${styles.bar} ${visible ? "" : styles.hidden}`}>
        <button type="button" className={columnClass("location")} onClick={() => setOpenField("location")}>
          <span className={styles.caption}>Location</span>
          <div className={styles.value}>
            <LocationIcon location={location} />
            <span>{LOCATION_LABELS[location]}</span>
          </div>
        </button>

        <button type="button" className={columnClass("time")} onClick={() => setOpenField("time")}>
          <span className={styles.caption}>Time</span>
          <div className={styles.value}>
            <span>{availableTime} min</span>
          </div>
        </button>

        <button type="button" className={columnClass("energy")} onClick={() => setOpenField("energy")}>
          <span className={styles.caption}>Energy</span>
          <div className={styles.value}>
            <EnergyIcon level={energy} />
            <span className={styles.energyValue}>{energy}</span>
          </div>
        </button>
      </div>

      <Sheet open={openField !== null} onClose={closeSheet}>
        {openField === "location" && (
          <LocationPicker
            value={location}
            onChange={(value) => {
              onLocationChange(value);
              closeSheet();
            }}
          />
        )}
        {openField === "time" && (
          <DurationPicker
            value={availableTime}
            onChange={(value) => {
              onAvailableTimeChange(value);
              closeSheet();
            }}
          />
        )}
        {openField === "energy" && (
          <EnergyPicker
            value={energy}
            onChange={(value) => {
              onEnergyChange(value);
              closeSheet();
            }}
          />
        )}
      </Sheet>
    </>
  );
}
