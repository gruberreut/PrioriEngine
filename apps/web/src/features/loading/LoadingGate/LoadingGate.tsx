import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingScreen } from "../LoadingScreen/LoadingScreen";
import { getTasksByStatus } from "../../../services/taskService";

/** Floor on how long the splash stays up, regardless of how fast the app is
 *  actually ready — keeps the loading state from flashing on a fast load. */
export const MIN_LOADING_MS = 1500;

interface LoadingGateProps {
  children: ReactNode;
}

export function LoadingGate({ children }: LoadingGateProps) {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, MIN_LOADING_MS));
    // Gate steps run one after another (this is the only real step today;
    // TASKS.md § 19's planned auth/authz steps would precede it, each
    // depending on the previous one having passed). That's intentional, not
    // an oversight: every step here needs the prior one's outcome, so there's
    // no pair that's actually safe to parallelize yet. If a future step is
    // added that's genuinely independent of the others (no shared
    // dependency, nothing to wait on), revisit this as an enhancement rather
    // than assuming strict sequencing is still correct - don't let it default
    // to sequential by inertia once that assumption stops holding.
    //
    // A failed check shouldn't strand the user on the splash forever - fail
    // open and let the app's existing per-slide in-progress handling catch
    // it if one really exists.
    const inProgressCheck = getTasksByStatus("in_progress")
      .then((tasks) => tasks[0] ?? null)
      .catch(() => null);

    Promise.all([minDelay, inProgressCheck]).then(([, inProgressTask]) => {
      if (cancelled) return;
      if (inProgressTask) {
        navigate("/in-progress", { replace: true });
      }
      setReady(true);
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
