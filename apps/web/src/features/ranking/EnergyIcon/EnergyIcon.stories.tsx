import type { Meta, StoryObj } from "@storybook/react";
import { EnergyIcon, type EnergyLevel } from "./EnergyIcon";

const defaultArgs = {
  level: "medium" as EnergyLevel,
  size: 16,
};

const meta: Meta<typeof EnergyIcon> = {
  title: "Features/Ranking/EnergyIcon",
  component: EnergyIcon,
  argTypes: {
    level: { control: "select", options: ["low", "medium", "high"] },
    size: { control: { type: "range", min: 8, max: 48, step: 2 } },
  },
};

export default meta;

export const Default: StoryObj<typeof EnergyIcon> = {
  args: defaultArgs,
};

export const Low: StoryObj<typeof EnergyIcon> = {
  args: { ...defaultArgs, level: "low", size: 48 },
};

export const Medium: StoryObj<typeof EnergyIcon> = {
  args: { ...defaultArgs, size: 48 },
};

export const High: StoryObj<typeof EnergyIcon> = {
  args: { ...defaultArgs, level: "high", size: 48 },
};

export const Sizes: StoryObj<typeof EnergyIcon> = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {(["low", "medium", "high"] as const).map((level) => (
        <div key={level} style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {[16, 24, 32, 48].map((size) => (
            <div key={size} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <EnergyIcon level={level} size={size} />
              <span style={{ fontSize: "11px", color: "#6B7280" }}>{size}px</span>
            </div>
          ))}
          <span style={{ fontSize: "13px", color: "#374151", marginLeft: "8px", textTransform: "capitalize" }}>{level}</span>
        </div>
      ))}
    </div>
  ),
};
