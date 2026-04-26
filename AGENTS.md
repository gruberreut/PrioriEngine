# Execution Approval Policy

- Do not execute implementation steps or make code changes unless the user explicitly approves execution.
- Default behavior is planning/discussion only until approval is given.
- If approval is ambiguous, ask for a clear "approve execution" confirmation.
- This policy applies globally across the project unless the user later defines exceptions.

# Component Implementation Policy

- Implement one component at a time.
- Do not proceed to the next component until the current one is explicitly approved.
- This applies to all component work in the project.
- Components strongly prefer props as inputs and `on*` callbacks as outputs. State is reserved for internal display tracking only, and only when necessary.
- Every component is either Presentational (no suffix) or a Page/Container (explicit suffix). These two types must not be mixed. See `guidelines/COMPONENT_BEST_PRACTICES.md` for the full distinction.
- Follow all naming conventions in `guidelines/COMPONENT_BEST_PRACTICES.md`. Check that file before creating any new component.
