import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Vitest runs without globals, so Testing Library can't register its own
// afterEach clean-up. Unmount whatever a React test rendered before the next one.
afterEach(() => {
  cleanup();
});
