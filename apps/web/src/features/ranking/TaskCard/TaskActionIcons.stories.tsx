import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentType } from "react";
import { Icon, type IconAssetProps } from "../../../components/Icon/Icon";
import { StartPlay } from "../../../assets/icons/StartPlay";
import { StartBolt } from "../../../assets/icons/StartBolt";
import { StartArrow } from "../../../assets/icons/StartArrow";
import { EditPencil } from "../../../assets/icons/EditPencil";
import { EditMarker } from "../../../assets/icons/EditMarker";
import { SnoozeBell } from "../../../assets/icons/SnoozeBell";
import { SnoozeMoon } from "../../../assets/icons/SnoozeMoon";
import { SnoozeClock } from "../../../assets/icons/SnoozeClock";
import { CompleteCheck } from "../../../assets/icons/CompleteCheck";
import { CompleteCircle } from "../../../assets/icons/CompleteCircle";
import { DeleteTrash } from "../../../assets/icons/DeleteTrash";
import { DeleteX } from "../../../assets/icons/DeleteX";

const groups: { label: string; options: { name: string; asset: ComponentType<IconAssetProps> }[] }[] = [
  {
    label: "Start",
    options: [
      { name: "Play", asset: StartPlay },
      { name: "Bolt", asset: StartBolt },
      { name: "Arrow", asset: StartArrow },
    ],
  },
  {
    label: "Edit",
    options: [
      { name: "Pencil", asset: EditPencil },
      { name: "Marker", asset: EditMarker },
    ],
  },
  {
    label: "Snooze",
    options: [
      { name: "Bell", asset: SnoozeBell },
      { name: "Moon", asset: SnoozeMoon },
      { name: "Clock", asset: SnoozeClock },
    ],
  },
  {
    label: "Complete",
    options: [
      { name: "Check", asset: CompleteCheck },
      { name: "Circle", asset: CompleteCircle },
    ],
  },
  {
    label: "Delete",
    options: [
      { name: "Trash", asset: DeleteTrash },
      { name: "X", asset: DeleteX },
    ],
  },
];

function IconGallery() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: 24 }}>
      {groups.map((group) => (
        <div key={group.label}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
            {group.label}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {group.options.map((option) => (
              <div
                key={option.name}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
              >
                <Icon asset={option.asset} label={option.name} size={32} />
                <span style={{ fontSize: 11, color: "#6b7280" }}>{option.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const meta: Meta = {
  title: "Features/Ranking/TaskCard/Action Icons",
  component: IconGallery,
};

export default meta;

export const AllOptions: StoryObj = {};
