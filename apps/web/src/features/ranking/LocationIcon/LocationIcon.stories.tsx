import type { Meta, StoryObj } from "@storybook/react";
import { LocationIcon, type LocationRequirement } from "./LocationIcon";

const defaultArgs = {
  location: "home" as LocationRequirement,
  size: 16,
};

const meta: Meta<typeof LocationIcon> = {
  title: "Features/Ranking/LocationIcon",
  component: LocationIcon,
  argTypes: {
    location: { control: "select", options: ["home", "in-person", "anywhere"] },
    size: { control: { type: "range", min: 8, max: 48, step: 2 } },
  },
};

export default meta;

export const Default: StoryObj<typeof LocationIcon> = {
  args: defaultArgs,
};

export const Home: StoryObj<typeof LocationIcon> = {
  args: { ...defaultArgs, location: "home", size: 48 },
};

export const InPerson: StoryObj<typeof LocationIcon> = {
  args: { ...defaultArgs, location: "in-person", size: 48 },
};

export const Anywhere: StoryObj<typeof LocationIcon> = {
  args: { ...defaultArgs, location: "anywhere", size: 48 },
};

export const Sizes: StoryObj<typeof LocationIcon> = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {(["home", "in-person", "anywhere"] as const).map((location) => (
        <div key={location} style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {[16, 24, 32, 48].map((size) => (
            <div key={size} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <LocationIcon location={location} size={size} />
              <span style={{ fontSize: "11px", color: "#6B7280" }}>{size}px</span>
            </div>
          ))}
          <span style={{ fontSize: "13px", color: "#374151", marginLeft: "8px" }}>{location}</span>
        </div>
      ))}
    </div>
  ),
};
