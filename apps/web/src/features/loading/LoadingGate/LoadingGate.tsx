import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingScreen } from "../LoadingScreen/LoadingScreen";
import { getTasksByStatus } from "../../../services/taskService";

/** Floor on how long the splash stays up, regardless of how fast the app is
 *  actually ready — keeps the loading state from flashing on a fast load. */
export const MIN_LOADING_MS = 1500;

type Navigate = ReturnType<typeof useNavigate>;

/** A gate step either lets the sequence continue, or redirects and stops it. */
type GateStepResult = "continue" | { redirect: string };
type GateStep = () => Promise<GateStepResult>;

// Steps run one after another, not in parallel. That's intentional, not an
// oversight: each step below depends on the previous one having passed
// (authzStep needs to know who the user is; inProgressStep shouldn't run if
// authzStep already redirected away) so there's no pair that's actually safe
// to parallelize today. If a future step turns out to be genuinely
// independent of the others - no shared dependency, nothing to wait on -
// treat that as its own enhancement to runGateSteps rather than assuming
// strict sequencing is still correct once it no longer holds.

/** No-op placeholder — ties into section 7's deferred "User provisioning"
 *  design work. Exists to give the sequence the right shape for when real
 *  auth lands (TASKS.md § 34), not to do anything today. */
const authStep: GateStep = async () => "continue";

/** No-op placeholder, same reasoning as authStep. */
const authzStep: GateStep = async () => "continue";

/** A failed check shouldn't strand the user on the splash forever - fail
 *  open and let the app's existing per-slide in-progress handling catch
 *  it if one really exists. */
const inProgressStep: GateStep = async () => {
  const task = await getTasksByStatus("in_progress")
    .then((tasks) => tasks[0] ?? null)
    .catch(() => null);
  return task ? { redirect: "/in-progress" } : "continue";
};

const GATE_STEPS: GateStep[] = [authStep, authzStep, inProgressStep];

async function runGateSteps(navigate: Navigate): Promise<void> {
  for (const step of GATE_STEPS) {
    const result = await step();
    if (result !== "continue") {
      navigate(result.redirect, { replace: true });
      return;
    }
  }
}

interface LoadingGateProps {
  children: ReactNode;
}

export function LoadingGate({ children }: LoadingGateProps) {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, MIN_LOADING_MS));

    Promise.all([minDelay, runGateSteps(navigate)]).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!ready) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
