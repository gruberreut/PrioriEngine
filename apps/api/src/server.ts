import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { asTaskArray, rankFromPayload } from "@priori/engine";
import type { RawTask, RuntimeParams } from "@priori/engine";

const PORT = 3001;
const CORS_ORIGIN = "http://localhost:5173";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TASKS_PATH = path.resolve(
  __dirname,
  "../../../packages/engine/test/data/tasks.example.json"
);

const tasksPath = process.env.PRIORI_TASKS_PATH ?? DEFAULT_TASKS_PATH;
const rawData: unknown = JSON.parse(await readFile(tasksPath, "utf8"));
const rawTasks: RawTask[] = asTaskArray(rawData);
const contexts = extractContexts(rawTasks);

console.log(`Loaded ${rawTasks.length} top-level tasks from ${tasksPath}`);

function extractContexts(tasks: RawTask[]): string[] {
  const set = new Set<string>();
  function walk(list: RawTask[]) {
    for (const t of list) {
      for (const ctx of t.contexts ?? []) set.add(ctx.trim().toLowerCase());
      if (t.children?.length) walk(t.children);
    }
  }
  walk(tasks);
  return [...set].sort();
}

function setCorsHeaders(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res: ServerResponse, status: number, data: unknown) {
  setCorsHeaders(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  const url = req.url ?? "";
  const method = req.method ?? "";

  if (method === "OPTIONS") {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (method === "GET" && url === "/api/tasks") {
    json(res, 200, rawTasks);
    return;
  }

  if (method === "GET" && url === "/api/contexts") {
    json(res, 200, contexts);
    return;
  }

  if (method === "POST" && url === "/api/rank") {
    try {
      const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
      const params: RuntimeParams = {
        currentTime: new Date(),
        availableTime: Number(body.availableTime ?? 30),
        energyLevel: (body.energyLevel as RuntimeParams["energyLevel"]) ?? "medium",
        context: body.context as string | undefined,
        location: body.location as string | undefined,
        explain: Boolean(body.explain ?? false),
        limit: Number(body.limit ?? 3),
      };
      json(res, 200, rankFromPayload(rawTasks, params));
    } catch {
      json(res, 400, { error: "Invalid request body" });
    }
    return;
  }

  json(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Priori API listening on http://localhost:${PORT}`);
});
