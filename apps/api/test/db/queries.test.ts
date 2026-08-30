import { beforeEach, describe, expect, it } from "vitest";
import { groupTasksByParent, queryTasks } from "../../src/db/queries.js";
import { clearAll, db, seedTask, seedUser } from "../helpers/db.js";

beforeEach(async () => {
  await clearAll();
});

describe("queryTasks", () => {
  it("returns only tasks belonging to the given user", async () => {
    const user = await seedUser();
    const other = await seedUser();
    const t1 = await seedTask(user.id, { title: "My task" });
    await seedTask(other.id, { title: "Other user task" });

    const rows = await queryTasks(db, user.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe(t1.id);
  });

  it("returns empty array when user has no tasks", async () => {
    const user = await seedUser();
    const rows = await queryTasks(db, user.id);
    expect(rows).toHaveLength(0);
  });
});

describe("groupTasksByParent", () => {
  it("groups rows by parentId, keyed by null for roots", () => {
    const rows = [
      { id: "a", parentId: null },
      { id: "b", parentId: "a" },
      { id: "c", parentId: "a" },
      { id: "d", parentId: null },
    ];

    const grouped = groupTasksByParent(rows);

    expect(grouped.get(null)).toEqual([
      { id: "a", parentId: null },
      { id: "d", parentId: null },
    ]);
    expect(grouped.get("a")).toEqual([
      { id: "b", parentId: "a" },
      { id: "c", parentId: "a" },
    ]);
  });

  it("returns an empty map for an empty input", () => {
    expect(groupTasksByParent([]).size).toBe(0);
  });
});
