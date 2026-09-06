import { describe, it, expect } from "vitest";
import { getGreeting } from "./getGreeting";

function atHour(hour: number): Date {
  return new Date(2024, 0, 1, hour);
}

describe("getGreeting", () => {
  it("returns a morning greeting before noon", () => {
    expect(getGreeting(atHour(0))).toBe("Good morning");
    expect(getGreeting(atHour(11))).toBe("Good morning");
  });

  it("returns an afternoon greeting from noon up to 5pm", () => {
    expect(getGreeting(atHour(12))).toBe("Good afternoon");
    expect(getGreeting(atHour(16))).toBe("Good afternoon");
  });

  it("returns an evening greeting from 5pm onward", () => {
    expect(getGreeting(atHour(17))).toBe("Good evening");
    expect(getGreeting(atHour(23))).toBe("Good evening");
  });
});
