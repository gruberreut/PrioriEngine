import type { IncomingMessage, ServerResponse } from "node:http";
import { and, asc, eq, max } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../db/schema.js";
import { contexts as contextsTable } from "../db/schema.js";
import { json, readBody } from "../lib/http.js";

type Db = NodePgDatabase<typeof schema>;

// Matches the number of --color-slide-* tints in tokens.css.
const SLIDE_PALETTE_SIZE = 8;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ContextRow = typeof contextsTable.$inferSelect;

interface CreateContextInput {
  id?: string;
  name: string; // trimmed, non-empty
}

// The create contract (guidelines/STORE_BEST_PRACTICES.md § 8, client-data-store LLD § 8).
type CreateContextOutcome =
  | { kind: "created"; context: ContextRow }
  | { kind: "retry"; context: ContextRow } // same id, same user, same name: idempotent
  | { kind: "id_conflict" } // the id belongs to another user's row, or to a row with another name
  | { kind: "name_taken"; context: ContextRow };

// Returns null for any invalid body. The form already blocks an empty name,
// so a 400 here is a technical error and carries no code.
function parseCreateBody(raw: string): CreateContextInput | null {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const { id, name } = body as Record<string, unknown>;
  if (id !== undefined && (typeof id !== "string" || !UUID_PATTERN.test(id))) return null;
  if (typeof name !== "string" || name.trim() === "") return null;
  return { id: id as string | undefined, name: name.trim() };
}

async function createContext(
  db: Db,
  userId: string,
  { id, name }: CreateContextInput
): Promise<CreateContextOutcome> {
  return db.transaction(async (tx) => {
    // Assigned from a monotonically increasing counter, never by reusing
    // a freed index — see tasks/TASKS-DONE.md §14 for why (keeps hue-wheel order
    // matching creation order once contexts can be archived, §42).
    const [{ maxIndex }] = await tx
      .select({ maxIndex: max(contextsTable.slideIndex) })
      .from(contextsTable)
      .where(eq(contextsTable.userId, userId));
    const slideIndex = ((maxIndex ?? -1) + 1) % SLIDE_PALETTE_SIZE;

    // No conflict target: covers both the id primary key and (user_id, name).
    const [created] = await tx
      .insert(contextsTable)
      .values({ ...(id ? { id } : {}), userId, name, slideIndex })
      .onConflictDoNothing()
      .returning();
    if (created) return { kind: "created", context: created };

    if (id) {
      const [byId] = await tx.select().from(contextsTable).where(eq(contextsTable.id, id));
      if (byId) {
        // slideIndex isn't compared: the retry gets the row as stored.
        return byId.userId === userId && byId.name === name
          ? { kind: "retry", context: byId }
          : { kind: "id_conflict" };
      }
    }

    const [byName] = await tx
      .select()
      .from(contextsTable)
      .where(and(eq(contextsTable.userId, userId), eq(contextsTable.name, name)));
    if (byName) return { kind: "name_taken", context: byName };

    // The insert conflicted, yet neither row is found: report it as a failure, not a guess.
    throw new Error("Context insert conflicted with no matching row");
  });
}

export function createContextsHandler(db: Db, devUserId: string) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    method: string
  ): Promise<boolean> => {
    if (method === "GET" && pathname === "/api/contexts") {
      try {
        const rows = await db
          .select()
          .from(contextsTable)
          .where(eq(contextsTable.userId, devUserId))
          .orderBy(asc(contextsTable.slideIndex));
        json(res, 200, rows);
      } catch {
        json(res, 500, { error: "Database error" });
      }
      return true;
    }

    if (method === "POST" && pathname === "/api/contexts") {
      try {
        const input = parseCreateBody(await readBody(req));
        if (!input) {
          json(res, 400, { error: "Bad request" });
          return true;
        }
        const outcome = await createContext(db, devUserId, input);
        switch (outcome.kind) {
          case "created":
            json(res, 201, outcome.context);
            break;
          case "retry":
            json(res, 200, outcome.context);
            break;
          case "id_conflict":
            json(res, 409, { error: "Conflict", code: "id_conflict" });
            break;
          case "name_taken":
            json(res, 409, {
              error: "Context name already taken",
              code: "name_taken",
              context: outcome.context,
            });
            break;
        }
      } catch {
        json(res, 500, { error: "Database error" });
      }
      return true;
    }

    return false;
  };
}
