import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { eq } from "drizzle-orm";
import { asTaskArray } from "@priori/engine";
import type { RawTask } from "@priori/engine";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { setCorsHeaders, json } from "./lib/http.js";
import { createTasksHandler } from "./routes/tasks.js";
import { createContextsHandler } from "./routes/contexts.js";
import { createRankHandler } from "./routes/rank.js";

const PORT = 3001;
const DEV_USER_EMAIL = "dev@priori.local";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TASKS_PATH = path.resolve(
  __dirname,
  "../../../packages/engine/test/data/tasks.example.json"
);

const tasksPath = process.env.PRIORI_TASKS_PATH ?? DEFAULT_TASKS_PATH;
const rawData: unknown = JSON.parse(await readFile(tasksPath, "utf8"));
const rawTasks: RawTask[] = asTaskArray(rawData);
console.log(`Loaded ${rawTasks.length} top-level tasks from ${tasksPath} (used by /api/rank)`);

const [devUser] = await db.select().from(users).where(eq(users.email, DEV_USER_EMAIL));
if (!devUser) throw new Error(`Dev user not found — run npm run db:seed first.`);
const devUserId = devUser.id;
console.log(`Dev user: ${DEV_USER_EMAIL} (${devUserId})`);

const handlers = [
  createTasksHandler(db, devUserId),
  createContextsHandler(db, devUserId),
  createRankHandler(rawTasks),
];

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  const method = req.method ?? "";

  if (method === "OPTIONS") {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  for (const handle of handlers) {
    if (await handle(req, res, pathname, method)) return;
  }

  json(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Priori API listening on http://localhost:${PORT}`);
});
