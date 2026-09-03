import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { LoadingScreen } from "../LoadingScreen/LoadingScreen";

/** Floor on how long the splash stays up, regardless of how fast the app is
 *  actually ready — keeps the loading state from flashing on a fast load. */
export const MIN_LOADING_MS = 1500;

interface LoadingGateProps {
  children: ReactNode;
}

export function LoadingGate({ children }: LoadingGateProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
