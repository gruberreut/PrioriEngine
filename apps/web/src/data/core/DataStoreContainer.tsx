import { useCallback, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { FailureDialog } from "../../components/FailureDialog/FailureDialog";
import { createQueryClient } from "./queryClient";

// The app's QueryClient, its provider, and the one failure dialog
// (documentation/techDesign/client-data-store/lld.md § 3, tasks/TASKS-TECH.md § 31).
// Rendered in main.tsx, above the router.
export function DataStoreContainer({ children }: { children: ReactNode }) {
  // Owned by this container, not a module global, so every story and test
  // gets its own client and failure state. Opening it again while it's open
  // changes nothing, so many failures show one dialog.
  const [failed, setFailed] = useState(false);
  const [queryClient] = useState(() =>
    createQueryClient({ onTechnicalError: () => setFailed(true) }),
  );

  // Pending and paused mutations are kept: they're changes the user made.
  // Every query is invalidated: active ones refetch now, inactive ones when next read.
  const refresh = useCallback(() => {
    setFailed(false);
    void queryClient.invalidateQueries();
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <FailureDialog open={failed} onConfirm={refresh} />
    </QueryClientProvider>
  );
}
