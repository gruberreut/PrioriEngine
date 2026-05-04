import type { ComponentType } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Icon, type IconAssetProps } from "./Icon";
import { Play } from "../../assets/icons/Play";

const defaultArgs = {
  asset: Play,
  label: "play",
  size: 16,
  viewBox: "0 0 24 24",
};

const iconModules = import.meta.glob("../../assets/icons/*.tsx", { eager: true }) as Record<
  string,
  Record<string, ComponentType<IconAssetProps>>
>;

const meta: Meta<typeof Icon> = {
  title: "Atomic/Icon",
  component: Icon,
  argTypes: {
    size: { control: { type: "range", min: 8, max: 64, step: 2 } },
  },
};

export default meta;

export const Default: StoryObj<typeof Icon> = {
  args: defaultArgs,
};

export const Sizes: StoryObj<typeof Icon> = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      {[12, 16, 24, 32, 48].map((size) => (
        <div key={size} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <Icon asset={Play} label="play" size={size} />
          <span style={{ fontSize: "11px", color: "#6B7280" }}>{size}px</span>
        </div>
      ))}
    </div>
  ),
};


export const Gallery: StoryObj = {
  render: () => {
    const icons: { name: string; asset: ComponentType<IconAssetProps> }[] = [];

    for (const [path, module] of Object.entries(iconModules)) {
      const name = path.split("/").pop()!.replace(".tsx", "");
      const asset = module[name];
      if (!asset) continue;
      icons.push({ name, asset });
    }

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: 24 }}>
        {icons.sort((a, b) => a.name.localeCompare(b.name)).map(({ name, asset }) => (
          <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px" }}>
            <Icon asset={asset} label={name} size={32} />
            <span style={{ fontSize: 11, color: "#6b7280" }}>{name}</span>
          </div>
        ))}
      </div>
    );
  },
};
