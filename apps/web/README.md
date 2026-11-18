# @priori/web

React + Vite web UI for TempAppName. It talks to `apps/api` over HTTP (`/api/*`) and never imports the Priori Engine directly; ranking happens on the server.

**▶ [Live component library (Storybook)](https://gruberreut.github.io/PrioriEngine/)** — every component, its variants and both themes.

## Running it

From the repository root:

```bash
npm ci                               # install all workspace dependencies
npm run dev                          # API + web together (web on http://localhost:5173)
npm run storybook -w @priori/web     # Storybook on http://localhost:6006

npm test -w @priori/web              # Vitest
npm run lint -w @priori/web          # ESLint (zero warnings) + Stylelint
npm run build -w @priori/web         # type-check + production build
```

The dev server proxies `/api` to the API on `localhost:3001`, which needs a local PostgreSQL (see `apps/api/README.md`). Storybook needs neither: every story renders from fixtures.

## Layout (`src/`)

```
components/   generic UI primitives with no domain knowledge (Button, Select, Carousel, Sheet, …)
entity/       domain-aware components shared across features (TaskCard)
features/     components that belong to one feature: ranking, tasks, loading, theme
services/     API clients
types/        shared TypeScript types
styles/       design tokens (tokens.css), token tests and the token docs pages
```

## How it's built

- **Presentational vs. container components.** Components take props in and report out through `on*` callbacks; pages and containers (explicit `…Page` suffix) own data and state. The two never mix. See [`guidelines/COMPONENT_BEST_PRACTICES.md`](../../guidelines/COMPONENT_BEST_PRACTICES.md).
- **Three-layer design tokens.** A raw palette, semantic roles (with light and dark modes), and per-component tokens, all in `src/styles/tokens.css`; component CSS only references its own component's tokens. Rationale in [`documentation/ARCHITECTURE.md`](../../documentation/ARCHITECTURE.md) § Frontend.
- **CSS Modules, mobile-first.** One module per component, no inline styles; base rules are the mobile layout and `@media (width >= …)` layers on larger screens.
- **Storybook-first.** Every component has stories (with all callbacks wired to the actions panel) and is reviewed in Storybook before it's used in a page.

Contributor conventions in full: [`CLAUDE.md`](CLAUDE.md).
