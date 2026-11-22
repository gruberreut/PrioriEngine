import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch, ApiError } from "./apiFetch";

function mockResponse(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), { status })
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function caught(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => {
      throw new Error("expected a rejection");
    },
    (err: unknown) => err
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("returns the parsed body for 200 and 201", async () => {
    mockResponse(200, { a: 1 });
    expect(await apiFetch("/api/x")).toEqual({ a: 1 });

    mockResponse(201, { b: 2 });
    expect(await apiFetch("/api/x", { method: "POST", body: {} })).toEqual({ b: 2 });
  });

  it("returns undefined for 204", async () => {
    mockResponse(204);
    expect(await apiFetch("/api/x", { method: "DELETE" })).toBeUndefined();
  });

  it("sends a body as JSON with a Content-Type header", async () => {
    const fetchMock = mockResponse(201, {});
    await apiFetch("/api/x", { method: "POST", body: { name: "garden" } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "garden" }));
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("sends no Content-Type header without a body", async () => {
    const fetchMock = mockResponse(200, []);
    await apiFetch("/api/x");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("GET");
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeUndefined();
  });

  it("passes the signal through", async () => {
    const fetchMock = mockResponse(200, []);
    const controller = new AbortController();
    await apiFetch("/api/x", { signal: controller.signal });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBe(controller.signal);
  });

  it("throws an http ApiError with the status, code and body for a non-OK response", async () => {
    const body = { error: "Context name already taken", code: "name_taken", context: { id: "c1" } };
    mockResponse(409, body);

    const err = await caught(apiFetch("/api/contexts", { method: "POST", body: {} }));

    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ kind: "http", status: 409, code: "name_taken", body });
    expect((err as ApiError).message).toContain("Context name already taken");
  });

  it("throws an http ApiError with no code when the error body isn't JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("oops", { status: 500 })));

    const err = await caught(apiFetch("/api/x"));

    expect(err).toMatchObject({ kind: "http", status: 500, code: undefined, body: undefined });
  });

  it("throws a network ApiError when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const err = await caught(apiFetch("/api/x"));

    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ kind: "network", status: null, code: undefined });
  });

  it("rethrows an abort unchanged", async () => {
    const abort = new DOMException("The operation was aborted.", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abort));

    const err = await caught(apiFetch("/api/x"));

    expect(err).toBe(abort);
  });
});
