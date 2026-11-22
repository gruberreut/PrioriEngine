// @vitest-environment jsdom
import { useEffect } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { ApiError } from "../../services/apiFetch";
import { DataStoreContainer } from "./DataStoreContainer";

const networkError = () => new ApiError("network", { kind: "network", status: null });
const httpError = (status: number, code?: string) =>
  new ApiError(`http ${status}`, { kind: "http", status, code });

function Query({ name, queryFn }: { name: string; queryFn: () => Promise<unknown> }) {
  const { status } = useQuery({ queryKey: [name], queryFn, retryDelay: 0 });
  return <p>{`${name}: ${status}`}</p>;
}

function Mutation({
  mutationFn,
  expectedErrors,
}: {
  mutationFn: () => Promise<unknown>;
  expectedErrors?: string[];
}) {
  const { mutate, status } = useMutation({ mutationFn, meta: { expectedErrors } });
  return (
    <>
      <button onClick={() => mutate()}>Save</button>
      <p>{`save: ${status}`}</p>
    </>
  );
}

let client: QueryClient | undefined;
function CaptureClient() {
  const queryClient = useQueryClient();
  useEffect(() => {
    client = queryClient;
  }, [queryClient]);
  return null;
}

function dialog() {
  return screen.queryByRole("alertdialog");
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  client = undefined;
});

describe("DataStoreContainer", () => {
  it("renders its children with no dialog", () => {
    render(
      <DataStoreContainer>
        <p>page</p>
      </DataStoreContainer>
    );

    expect(screen.getByText("page")).toBeDefined();
    expect(dialog()).toBeNull();
  });

  it("opens no dialog for a failure the retry recovers from", async () => {
    const queryFn = vi.fn().mockRejectedValueOnce(httpError(503)).mockResolvedValue([]);
    render(
      <DataStoreContainer>
        <Query name="tasks" queryFn={queryFn} />
      </DataStoreContainer>
    );

    await screen.findByText("tasks: success");
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(dialog()).toBeNull();
  });

  it("opens the dialog once when the first attempt and the retry both fail", async () => {
    const queryFn = vi.fn().mockRejectedValue(networkError());
    render(
      <DataStoreContainer>
        <Query name="tasks" queryFn={queryFn} />
      </DataStoreContainer>
    );

    await screen.findByText("tasks: error");
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(screen.getAllByRole("alertdialog")).toHaveLength(1);
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("shows one dialog for several failures", async () => {
    render(
      <DataStoreContainer>
        <Query name="tasks" queryFn={() => Promise.reject(httpError(500))} />
        <Query name="contexts" queryFn={() => Promise.reject(httpError(500))} />
        <Mutation mutationFn={() => Promise.reject(httpError(500))} />
      </DataStoreContainer>
    );

    await screen.findByText("tasks: error");
    await screen.findByText("contexts: error");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("save: error");

    expect(screen.getAllByRole("alertdialog")).toHaveLength(1);
    expect(console.error).toHaveBeenCalledTimes(3);
  });

  it("closes on OK, and a new failure opens it again", async () => {
    render(
      <DataStoreContainer>
        <Mutation mutationFn={() => Promise.reject(httpError(500))} />
      </DataStoreContainer>
    );

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await userEvent.click(await screen.findByRole("button", { name: "OK" }));
    expect(dialog()).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(dialog()).not.toBeNull());
  });

  it("OK invalidates every query: active ones refetch, inactive ones are marked stale", async () => {
    const tasksFn = vi.fn().mockResolvedValue([]);
    render(
      <DataStoreContainer>
        <CaptureClient />
        <Query name="tasks" queryFn={tasksFn} />
        <Mutation mutationFn={() => Promise.reject(httpError(500))} />
      </DataStoreContainer>
    );
    await screen.findByText("tasks: success");
    client!.setQueryData(["inactive"], "cached");

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await userEvent.click(await screen.findByRole("button", { name: "OK" }));

    await waitFor(() => expect(tasksFn).toHaveBeenCalledTimes(2));
    expect(client!.getQueryState(["inactive"])?.isInvalidated).toBe(true);
    expect(client!.getQueryData(["inactive"])).toBe("cached");
  });

  it("opens nothing for an expected error", async () => {
    render(
      <DataStoreContainer>
        <Mutation
          mutationFn={() => Promise.reject(httpError(409, "name_taken"))}
          expectedErrors={["name_taken"]}
        />
      </DataStoreContainer>
    );

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("save: error");

    expect(dialog()).toBeNull();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("gives each instance its own client and failure state", async () => {
    render(
      <>
        <DataStoreContainer>
          <Mutation mutationFn={() => Promise.reject(httpError(500))} />
        </DataStoreContainer>
        <DataStoreContainer>
          <p>other</p>
        </DataStoreContainer>
      </>
    );

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("save: error");

    expect(screen.getAllByRole("alertdialog")).toHaveLength(1);
  });
});
