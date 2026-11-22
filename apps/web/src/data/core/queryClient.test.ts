import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MutationObserver, type QueryClient } from "@tanstack/react-query";
import { ApiError } from "../../services/apiFetch";
import {
  createQueryClient,
  retryOnceOnNetworkError,
  retryOnceOnNetworkOrServerError,
} from "./queryClient";

const networkError = () => new ApiError("network", { kind: "network", status: null });
const httpError = (status: number, code?: string) =>
  new ApiError(`http ${status}`, { kind: "http", status, code });

let onTechnicalError: ReturnType<typeof vi.fn>;
let queryClient: QueryClient;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  onTechnicalError = vi.fn();
  queryClient = createQueryClient({ onTechnicalError });
});

afterEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

// Fails with each error in turn, then resolves.
function failingThen(...errors: ApiError[]) {
  const fn = vi.fn();
  for (const error of errors) fn.mockRejectedValueOnce(error);
  return fn.mockResolvedValue("ok");
}

function fetchQuery(queryFn: () => Promise<unknown>, meta?: { expectedErrors?: string[] }) {
  return queryClient
    .fetchQuery({ queryKey: ["test"], queryFn, retryDelay: 0, meta })
    .catch(() => undefined);
}

function runMutation(
  mutationFn: () => Promise<unknown>,
  options: { retry?: typeof retryOnceOnNetworkError; meta?: { expectedErrors?: string[] } } = {}
) {
  const observer = new MutationObserver(queryClient, {
    mutationKey: ["test", "create"],
    mutationFn,
    retryDelay: 0,
    ...options,
  });
  return observer.mutate(undefined).catch(() => undefined);
}

describe("retry rules", () => {
  it("queries retry once, on network errors and 5xx only", () => {
    expect(retryOnceOnNetworkOrServerError(0, networkError())).toBe(true);
    expect(retryOnceOnNetworkOrServerError(0, httpError(503))).toBe(true);
    expect(retryOnceOnNetworkOrServerError(0, httpError(404))).toBe(false);
    expect(retryOnceOnNetworkOrServerError(1, networkError())).toBe(false);
  });

  it("idempotent mutations retry once, on network errors only", () => {
    expect(retryOnceOnNetworkError(0, networkError())).toBe(true);
    expect(retryOnceOnNetworkError(0, httpError(503))).toBe(false);
    expect(retryOnceOnNetworkError(1, networkError())).toBe(false);
  });
});

describe("queries", () => {
  it("a failure the retry recovers from doesn't reach the handler", async () => {
    const queryFn = failingThen(httpError(500));
    await fetchQuery(queryFn);

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(onTechnicalError).not.toHaveBeenCalled();
  });

  it("a failed first attempt and a failed retry reach the handler once", async () => {
    const queryFn = failingThen(networkError(), networkError());
    await fetchQuery(queryFn);

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(onTechnicalError).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("a 4xx isn't retried", async () => {
    const queryFn = failingThen(httpError(404));
    await fetchQuery(queryFn);

    expect(queryFn).toHaveBeenCalledOnce();
    expect(onTechnicalError).toHaveBeenCalledOnce();
  });

  it("an expected error doesn't reach the handler", async () => {
    await fetchQuery(failingThen(httpError(409, "name_taken")), { expectedErrors: ["name_taken"] });

    expect(onTechnicalError).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("an error code not declared as expected reaches the handler", async () => {
    await fetchQuery(failingThen(httpError(409, "id_conflict")), { expectedErrors: ["name_taken"] });

    expect(onTechnicalError).toHaveBeenCalledOnce();
  });
});

describe("mutations", () => {
  it("don't retry by default", async () => {
    const mutationFn = failingThen(networkError());
    await runMutation(mutationFn);

    expect(mutationFn).toHaveBeenCalledOnce();
    expect(onTechnicalError).toHaveBeenCalledOnce();
  });

  it("with retryOnceOnNetworkError, a network failure the retry recovers from doesn't reach the handler", async () => {
    const mutationFn = failingThen(networkError());
    await runMutation(mutationFn, { retry: retryOnceOnNetworkError });

    expect(mutationFn).toHaveBeenCalledTimes(2);
    expect(onTechnicalError).not.toHaveBeenCalled();
  });

  it("with retryOnceOnNetworkError, an HTTP error isn't retried", async () => {
    const mutationFn = failingThen(httpError(500));
    await runMutation(mutationFn, { retry: retryOnceOnNetworkError });

    expect(mutationFn).toHaveBeenCalledOnce();
    expect(onTechnicalError).toHaveBeenCalledOnce();
  });

  it("an expected error doesn't reach the handler", async () => {
    await runMutation(failingThen(httpError(409, "name_taken")), {
      meta: { expectedErrors: ["name_taken"] },
    });

    expect(onTechnicalError).not.toHaveBeenCalled();
  });

  it("logs the error with the mutation key and variables", async () => {
    await runMutation(failingThen(httpError(500)));

    expect(console.error).toHaveBeenCalledWith(
      "[data] mutation failed",
      expect.objectContaining({
        error: expect.objectContaining({ kind: "http", status: 500 }),
        mutationKey: ["test", "create"],
      })
    );
  });
});
