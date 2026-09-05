import { randomUUID } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { sql } from "drizzle-orm";
import * as schema from "../../src/db/schema.js";

const { Pool } = pg;

const TEST_DB_URL = process.env.TEST_DATABASE_URL ?? "postgresql://localhost/priori_test";
const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, "../../drizzle");

const pool = new Pool({ connectionString: TEST_DB_URL });
export const db = drizzle(pool, { schema });

export async function runMigrations() {
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
}

export async function clearAll() {
  await db.execute(sql`TRUNCATE users, contexts, tasks RESTART IDENTITY CASCADE`);
}

export async function seedUser(email = `test-${randomUUID()}@priori.test`) {
  const [user] = await db.insert(schema.users).values({ email }).returning();
  return user!;
}

export async function seedContext(userId: string, name: string, slideIndex = 0) {
  const [ctx] = await db.insert(schema.contexts).values({ userId, name, slideIndex }).returning();
  return ctx!;
}

type SeedTaskOverrides = Partial<typeof schema.tasks.$inferInsert>;

export async function seedTask(userId: string, overrides: SeedTaskOverrides = {}) {
  const [task] = await db
    .insert(schema.tasks)
    .values({
      id: randomUUID(),
      userId,
      title: "Test task",
      priority: 5,
      duration: 30,
      energyRequired: "medium",
      location: "anywhere",
      status: "pending",
      ...overrides,
    })
    .returning();
  return task!;
}
