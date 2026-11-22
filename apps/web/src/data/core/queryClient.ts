import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "../../services/apiFetch";

// The QueryClient's defaults and its central error handler
// (documentation/techDesign/client-data-store/lld.md § 2).

export interface DataMeta extends Record<string, unknown> {
  // Error codes the user can fix by changing their input. The owning data/
  // module handles them; the central handler skips them.
  expectedErrors?: string[];
}

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
    queryMeta: DataMeta;
    mutationMeta: DataMeta;
  }
}

// failureCount is the number of failed attempts before this one, so 0 on the
// first failure: `failureCount < 1` allows exactly one retry.

// Queries: retry once, on network errors and 5xx only. A 4xx gets the same answer again.
export function retryOnceOnNetworkOrServerError(failureCount: number, error: ApiError): boolean {
  if (failureCount >= 1 || !(error instanceof ApiError)) return false;
  return error.kind === "network" || (error.status !== null && error.status >= 500);
}

// Mutations whose endpoint is idempotent by client id set this themselves.
// Never on an HTTP error response: the server did answer.
export function retryOnceOnNetworkError(failureCount: number, error: ApiError): boolean {
  return failureCount < 1 && error instanceof ApiError && error.kind === "network";
}

function isExpected(error: unknown, meta: DataMeta | undefined): boolean {
  const code = error instanceof ApiError ? error.code : undefined;
  return code !== undefined && (meta?.expectedErrors?.includes(code) ?? false);
}

export function createQueryClient(options: { onTechnicalError: () => void }): QueryClient {
  const { onTechnicalError } = options;

  return new QueryClient({
    // TanStack calls these only once the last attempt has failed, so a
    // failure that a retry recovers from never reaches them.
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (isExpected(error, query.meta)) return;
        console.error("[data] query failed", { error: describe(error), queryKey: query.queryKey });
        onTechnicalError();
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, _context, mutation) => {
        if (isExpected(error, mutation.meta)) return;
        console.error("[data] mutation failed", {
          error: describe(error),
          mutationKey: mutation.options.mutationKey,
          variables,
        });
        onTechnicalError();
      },
    }),
    // No global staleTime or gcTime: each entity's query options set them (guide §4).
    defaultOptions: {
      queries: { retry: retryOnceOnNetworkOrServerError },
      mutations: { retry: false },
    },
  });
}

function describe(error: unknown) {
  if (!(error instanceof ApiError)) return error;
  return { kind: error.kind, status: error.status, code: error.code, body: error.body, message: error.message };
}
