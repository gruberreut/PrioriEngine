import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { reportCliError, runRankCli } from "../src/runCli.js";

const FIXTURE = path.resolve("test/fixtures/base.json");

describe("runCli", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it("runRankCli prints ranked output", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await runRankCli(
      ["--tasks", FIXTURE, "--now", "2026-04-17T12:00:00Z", "--limit", "1"],
      { fixedNow: new Date("2026-04-17T12:00:00Z") }
    );
    expect(log).toHaveBeenCalled();
    const out = String(log.mock.calls[0]?.[0] ?? "");
    expect(out).toMatch(/\d+\.\s/);
  });

  it("reportCliError logs and sets exit code", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    process.exitCode = undefined;
    reportCliError(new Error("boom"));
    expect(err).toHaveBeenCalledWith("Priori Engine error: boom");
    expect(process.exitCode).toBe(1);

    err.mockClear();
    process.exitCode = undefined;
    reportCliError("plain");
    expect(err).toHaveBeenCalledWith("Priori Engine error: plain");
    expect(process.exitCode).toBe(1);
  });
});
