// Every services/ function calls the API through apiFetch, so every failure
// reaches the store as an ApiError (documentation/techDesign/client-data-store/lld.md § 1).

export class ApiError extends Error {
  readonly kind: "network" | "http"; // network: no response at all
  readonly status: number | null; // null when kind is "network"
  readonly code: string | undefined; // body.code, e.g. "name_taken"
  readonly body: unknown; // parsed JSON body, if any

  constructor(
    message: string,
    details: { kind: "network" | "http"; status: number | null; code?: string; body?: unknown },
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = details.kind;
    this.status = details.status;
    this.code = details.code;
    this.body = details.body;
  }
}

export interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;
  const hasBody = body !== undefined;

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: hasBody ? { "Content-Type": "application/json" } : undefined,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    // A cancellation, not a failure: TanStack recognises it and doesn't treat it as an error.
    if (signal?.aborted || isAbortError(err)) throw err;
    throw new ApiError(`${method} ${path}: network error`, { kind: "network", status: null });
  }

  if (!res.ok) {
    const errorBody = await readJson(res);
    const fields = isRecord(errorBody) ? errorBody : {};
    const message = typeof fields.error === "string" ? fields.error : "Request failed";
    throw new ApiError(`${method} ${path}: ${res.status} ${message}`, {
      kind: "http",
      status: res.status,
      code: typeof fields.code === "string" ? fields.code : undefined,
      body: errorBody,
    });
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
