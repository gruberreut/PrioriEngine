import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "./Icon";
import { FlameLow } from "../../assets/icons/FlameLow";
import { FlameMedium } from "../../assets/icons/FlameMedium";
import { FlameHigh } from "../../assets/icons/FlameHigh";

const meta: Meta<typeof Icon> = {
  title: "Atomic/Icon",
  component: Icon,
  argTypes: {
    size: { control: { type: "range", min: 8, max: 64, step: 2 } },
  },
};

export default meta;

export const Low: StoryObj<typeof Icon> = {
  args: { asset: FlameLow, label: "low energy", size: 24 },
};

export const Medium: StoryObj<typeof Icon> = {
  args: { asset: FlameMedium, label: "medium energy", size: 24 },
};

export const High: StoryObj<typeof Icon> = {
  args: { asset: FlameHigh, label: "high energy", size: 24 },
};

export const Sizes: StoryObj<typeof Icon> = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      {[12, 16, 24, 32, 48].map((size) => (
        <div key={size} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <Icon asset={FlameMedium} label="medium energy" size={size} />
          <span style={{ fontSize: "11px", color: "#6B7280" }}>{size}px</span>
        </div>
      ))}
    </div>
  ),
};
