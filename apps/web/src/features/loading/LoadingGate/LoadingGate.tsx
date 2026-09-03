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
