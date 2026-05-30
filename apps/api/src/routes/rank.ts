import type { IncomingMessage, ServerResponse } from "node:http";
import { rankFromPayload } from "@priori/engine";
import type { RawTask, RuntimeParams } from "@priori/engine";
import { json, readBody } from "../lib/http.js";

export function createRankHandler(rawTasks: RawTask[]) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    method: string
  ): Promise<boolean> => {
    if (method === "POST" && pathname === "/api/rank") {
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
      return true;
    }

    return false;
  };
}
