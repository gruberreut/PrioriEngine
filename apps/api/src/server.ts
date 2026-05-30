import { createServer } from "node:http";
import { eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { setCorsHeaders, json } from "./lib/http.js";
import { createTasksHandler } from "./routes/tasks.js";
import { createContextsHandler } from "./routes/contexts.js";
import { createRankHandler } from "./routes/rank.js";

const PORT = 3001;
const DEV_USER_EMAIL = "dev@priori.local";

const [devUser] = await db.select().from(users).where(eq(users.email, DEV_USER_EMAIL));
if (!devUser) throw new Error(`Dev user not found — run npm run db:seed first.`);
const devUserId = devUser.id;
console.log(`Dev user: ${DEV_USER_EMAIL} (${devUserId})`);

const handlers = [
  createTasksHandler(db, devUserId),
  createContextsHandler(db, devUserId),
  createRankHandler(db, devUserId),
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
