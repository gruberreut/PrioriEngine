import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildRuntimeParams,
  parseArgValue,
  parseAvailableTime,
  parseEnergy,
  parseLimit,
  parseLocation,
  parseNow,
  resolveTasksPath,
} from "../src/cliParse.js";

describe("cliParse", () => {
  it("parseArgValue returns undefined when key missing or value missing", () => {
    expect(parseArgValue(["--foo"], "--bar")).toBeUndefined();
    expect(parseArgValue(["--foo"], "--foo")).toBeUndefined();
  });

  it("parseLimit defaults and validates", () => {
    expect(parseLimit([])).toBe(3);
    expect(parseLimit(["--limit", "5"])).toBe(5);
    expect(parseLimit(["--limit", "-2"])).toBe(2);
    expect(() => parseLimit(["--limit", "0"])).toThrow("Invalid --limit");
    expect(() => parseLimit(["--limit", "nan"])).toThrow("Invalid --limit");
  });

  it("parseEnergy accepts only known levels", () => {
    expect(parseEnergy([])).toBe("medium");
    expect(parseEnergy(["--energy", "low"])).toBe("low");
    expect(parseEnergy(["--energy", "high"])).toBe("high");
    expect(parseEnergy(["--energy", "invalid"])).toBe("medium");
  });

  it("parseNow uses fixed date or validates ISO", () => {
    const fixed = new Date("2026-01-01T00:00:00Z");
    expect(parseNow([], fixed).toISOString()).toBe(fixed.toISOString());
    expect(parseNow([]).getTime()).toBeGreaterThan(0);
    expect(parseNow(["--now", "2026-06-01T12:00:00Z"]).toISOString()).toBe(
      "2026-06-01T12:00:00.000Z"
    );
    expect(() => parseNow(["--now", "not-a-date"])).toThrow("Invalid --now");
  });

  it("parseAvailableTime defaults and validates", () => {
    expect(parseAvailableTime([])).toBe(30);
    expect(parseAvailableTime(["--available-time", "45"])).toBe(45);
    expect(() => parseAvailableTime(["--available-time", "0"])).toThrow(
      "Invalid --available-time"
    );
    expect(() => parseAvailableTime(["--available-time", "x"])).toThrow(
      "Invalid --available-time"
    );
  });

  it("resolveTasksPath resolves --tasks or default example path", () => {
    const custom = resolveTasksPath(["--tasks", "/tmp/foo.json"]);
    expect(custom).toBe(path.resolve("/tmp/foo.json"));
    const def = resolveTasksPath([]);
    expect(def).toMatch(/tasks\.example\.json$/);
  });

  it("parseLocation accepts known values and ignores unknown", () => {
    expect(parseLocation([])).toBeUndefined();
    expect(parseLocation(["--location", "home"])).toBe("home");
    expect(parseLocation(["--location", "in-person"])).toBe("in-person");
    expect(parseLocation(["--location", "anywhere"])).toBe("anywhere");
    expect(parseLocation(["--location", "  Home  "])).toBe("home");
    expect(parseLocation(["--location", "office"])).toBeUndefined();
  });

  it("buildRuntimeParams wires flags", () => {
    const fixed = new Date("2026-04-17T12:00:00Z");
    const p = buildRuntimeParams(
      [
        "--context",
        "  Garden ",
        "--location",
        "home",
        "--available-time",
        "20",
        "--energy",
        "high",
        "--explain",
        "--limit",
        "2",
        "--last-completed-project",
        "proj_x",
      ],
      { fixedNow: fixed }
    );
    expect(p.context).toBe("garden");
    expect(p.location).toBe("home");
    expect(p.availableTime).toBe(20);
    expect(p.energyLevel).toBe("high");
    expect(p.explain).toBe(true);
    expect(p.limit).toBe(2);
    expect(p.lastCompletedProject).toBe("proj_x");
    expect(p.currentTime).toBe(fixed);
  });
});
