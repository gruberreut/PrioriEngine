import { describe, it, expect } from "vitest";
import { mergeContexts } from "./mergeContexts";
import type { ContextItem } from "../../../services/contextService";

function makeContext(overrides: Partial<ContextItem>): ContextItem {
  return {
    id: "ctx-default",
    name: "Default",
    slideIndex: 0,
    ...overrides,
  };
}

describe("mergeContexts", () => {
  it("appends a newly created context not yet present in the caller's list", () => {
    const existing = [makeContext({ id: "ctx-1", name: "Learning" })];
    const added = [makeContext({ id: "ctx-new", name: "New context" })];

    const result = mergeContexts(existing, added);

    expect(result.map((c) => c.id)).toEqual(["ctx-1", "ctx-new"]);
  });

  it("does not duplicate a context once the caller's own list already includes it", () => {
    // Reproduces the reported bug: the task-creation page appends the newly created
    // context to its own `contexts` state after `onCreateContext` resolves, while the
    // form also remembers it locally in `addedContexts` — the same id ends up in both.
    const created = makeContext({ id: "ctx-new", name: "New context" });
    const contexts = [makeContext({ id: "ctx-1", name: "Learning" }), created];
    const addedContexts = [created];

    const result = mergeContexts(contexts, addedContexts);

    expect(result.map((c) => c.id)).toEqual(["ctx-1", "ctx-new"]);
  });

  it("keeps the caller's version when a context appears in both lists", () => {
    const contexts = [makeContext({ id: "ctx-new", name: "Renamed by caller" })];
    const addedContexts = [makeContext({ id: "ctx-new", name: "New context" })];

    const result = mergeContexts(contexts, addedContexts);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Renamed by caller");
  });

  it("returns an empty list when nothing has been added", () => {
    expect(mergeContexts([], [])).toEqual([]);
  });
});
