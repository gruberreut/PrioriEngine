import { runMigrations } from "./db.js";

export async function setup() {
  await runMigrations();
}
