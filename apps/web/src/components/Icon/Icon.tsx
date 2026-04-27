import { useId } from "react";
import type { ComponentType } from "react";

export interface IconAssetProps {
  id: string;
}

export interface IconProps {
  asset: ComponentType<IconAssetProps>;
  label: string;
  size?: number;
  viewBox?: string;
}

export function Icon({ asset: Asset, label, size = 16, viewBox = "0 0 24 24" }: IconProps) {
  const id = useId().replace(/:/g, "_");
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      role="img"
      aria-label={label}
    >
      <Asset id={id} />
    </svg>
  );
}
