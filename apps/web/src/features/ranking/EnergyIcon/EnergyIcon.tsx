import type { ComponentType } from "react";
import { Icon, type IconAssetProps } from "../../../components/Icon/Icon";
import { FlameLow } from "../../../assets/icons/FlameLow";
import { FlameMedium } from "../../../assets/icons/FlameMedium";
import { FlameHigh } from "../../../assets/icons/FlameHigh";

export type EnergyLevel = "low" | "medium" | "high";

export interface EnergyIconProps {
  level: EnergyLevel;
  size?: number;
}

const ASSETS: Record<EnergyLevel, ComponentType<IconAssetProps>> = {
  low: FlameLow,
  medium: FlameMedium,
  high: FlameHigh,
};

export function EnergyIcon({ level, size = 16 }: EnergyIconProps) {
  return (
    <Icon
      asset={ASSETS[level]}
      label={`${level} energy`}
      size={size}
    />
  );
}
