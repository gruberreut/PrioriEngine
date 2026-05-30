import { beforeEach, describe, expect, it } from "vitest";
import { queryTasks } from "../../src/db/queries.js";
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
