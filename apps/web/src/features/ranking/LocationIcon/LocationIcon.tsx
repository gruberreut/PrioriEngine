import type { ComponentType } from "react";
import { Icon, type IconAssetProps } from "../../../components/Icon/Icon";
import { House } from "../../../assets/icons/House";
import { Handshake } from "../../../assets/icons/Handshake";
import { Globe } from "../../../assets/icons/Globe";

export type LocationRequirement = "home" | "in-person" | "anywhere";

export const LOCATION_LABELS: Record<LocationRequirement, string> = {
  home: "Home",
  "in-person": "In person",
  anywhere: "Flexible",
};

const ASSETS: Record<LocationRequirement, ComponentType<IconAssetProps>> = {
  home: House,
  "in-person": Handshake,
  anywhere: Globe,
};

export interface LocationIconProps {
  location: LocationRequirement;
  size?: number;
}

export function LocationIcon({ location, size = 16 }: LocationIconProps) {
  return (
    <Icon
      asset={ASSETS[location]}
      label={LOCATION_LABELS[location]}
      size={size}
    />
  );
}
