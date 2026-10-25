export type LocationRequirement = "home" | "in-person" | "anywhere";

export const LOCATION_LABELS: Record<LocationRequirement, string> = {
  home: "Home",
  "in-person": "In person",
  anywhere: "Flexible",
};
