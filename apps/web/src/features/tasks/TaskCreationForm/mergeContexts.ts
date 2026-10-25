import type { ContextItem } from "../../../services/contextService";

/**
 * `contexts` is the caller's list; `addedContexts` is this form's own record of
 * contexts it has created this session. Once a created context round-trips back
 * into `contexts` (as it does on the real task-creation page, which appends to its
 * own state after `onCreateContext` resolves), the two lists briefly overlap by id —
 * dedupe here rather than assuming the caller never reflects it back.
 */
export function mergeContexts(contexts: ContextItem[], addedContexts: ContextItem[]): ContextItem[] {
  const knownIds = new Set(contexts.map((c) => c.id));
  return [...contexts, ...addedContexts.filter((c) => !knownIds.has(c.id))];
}
