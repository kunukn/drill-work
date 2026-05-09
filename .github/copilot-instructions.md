# Project Guidelines for drill-work

This file provides guidance to AI coding assistants (Claude Code, GitHub Copilot) when working with code in this repository.

## Commands

Package manager is **pnpm**; Node **>=22** is required (server uses `node:sqlite`).

Dev / build:

- `pnpm dev` — Vite dev server on port **3000**. The `predev` hook runs `scripts/setup.ts` (creates SQLite tables and seeds if empty).
- `pnpm dev:new` — wipe `local.db` and reseed before starting dev.
- `pnpm dev:empty` — wipe `local.db` and start dev without seed (`SKIP_SEED=1`).
- `pnpm build` — `prebuild` runs setup + `pnpm typecheck`, then `vite build`.
- `pnpm preview` / `pnpm start` — Vite preview, or run the Nitro build at `.output/server/index.mjs`.

Checks (run `pnpm check` before sending a PR):

- `pnpm typecheck` — `tsgo --noEmit` (TypeScript Native Preview, Go port of `tsc`, ~10× faster). `pnpm typecheck:tsc` falls back to stock `tsc`.
- `pnpm typecheck:bench` — runs `tsc` and `tsgo` in parallel with a side-by-side timing/error summary.
- `pnpm lint` / `pnpm lint:fix` — [oxlint](https://oxc.rs/docs/guide/usage/linter) (Rust-based).
- `pnpm format` / `pnpm format:check` — Prettier over `./src`.
- `pnpm check` — typecheck + lint + format:check.

Database:

- `pnpm db:generate` — `drizzle-kit generate` against `src/server/db/schema.ts`.
- `pnpm db:setup` — runs `scripts/setup.ts` directly.
- `pnpm db:reset` — delete `local.db` and reseed.

Hooks:

- `.husky/pre-commit` runs `lint-staged` (Prettier on staged files).
- `.husky/pre-push` runs `pnpm prepush` → `scripts/pre-push-checks.js` (typecheck + lint, parallelized).

There is no test runner configured.

**CRITICAL**: After code changes, run `pnpm check` as the final step. Do not consider the task complete until it passes.

## Toolchain policy

Speed-first. Pre-1.0 / preview tools (tsgo, oxlint) are tracked continuously rather than pinned. When upgrading them, run `pnpm typecheck` and `pnpm lint` against the full repo to confirm no regressions.

## Core Technologies

- **Framework**: TanStack Start (React 19 + Vite + Nitro), file-routed via TanStack Router
- **Language**: TypeScript (strict); type-checked with tsgo (TypeScript Native Preview)
- **Styling**: Tailwind CSS v4 (Vite plugin)
- **UI Library**: `@dfds-ui/navaigator` (company-skinned, pre-1.0); fall back to `src/components/generic/` then raw HTML
- **Data fetching**: TanStack Query + `ky` (HTTP client)
- **Forms & validation**: `react-hook-form` + `zod` via `@hookform/resolvers`
- **Server**: Nitro (co-located in the same app), `node:sqlite` via `drizzle-orm` + `drizzle-orm/sqlite-proxy`
- **Database**: SQLite (`local.db`), schema managed by Drizzle, migrations via `drizzle-kit`
- **OpenAPI**: `@asteasolutions/zod-to-openapi` (Zod schemas as the source of truth)
- **DX**: `unplugin-auto-import` for common identifiers; `tsx` for scripts; `husky` + `lint-staged` for git hooks
- **Lint / format**: oxlint (Rust) + Prettier
- **Package manager**: pnpm (Node >=22)

## Architecture

Single TanStack Start app (React 19 + Vite + Nitro) with a co-located server. UI and HTTP endpoints are both file routes; business/DB logic lives under `src/server/api`.

### Project layout

```text
src/
├── routes/                       # File-routed (TanStack Router)
│   ├── __root.tsx                # Shell layout + providers
│   ├── index.tsx                 # Dispatcher dashboard
│   ├── bookings.tsx              # Bookings layout
│   ├── bookings.index.tsx        # Bookings list
│   ├── bookings.$id.tsx          # Detail / edit
│   ├── bookings.new.tsx          # Create
│   └── api/                      # HTTP endpoints — thin adapters,
│                                 #   call into @/server/api/*
├── routeTree.gen.ts              # GENERATED — do not hand-edit
├── router.tsx                    # getRouter() factory
│
├── components/
│   ├── generic/                  # Cross-feature primitives
│   │                             #   (StatusBadge, ...). Reach here
│   │                             #   before raw HTML.
│   ├── bookings/                 # Feature components, co-located
│   ├── dashboard/                # Feature components, co-located
│   ├── Navbar.tsx
│   └── NotFound.tsx
│
├── lib/                          # Shared client helpers
│   ├── api.ts                    # Fetch wrappers
│   ├── queryClient.ts            # TanStack Query setup
│   └── booking-form-schema.ts    # Plain Zod (NO drizzle imports)
│
├── server/                       # Server-only code
│   ├── api/
│   │   ├── index.ts              # Side-effect imports — register
│   │   │                         #   every resource here for OpenAPI
│   │   ├── bookings.ts           # Each resource: Zod schemas +
│   │   ├── customers.ts          #   registry.register(...) +
│   │   ├── sailings.ts           #   data functions
│   │   ├── terminals.ts
│   │   └── vessels.ts
│   ├── db/
│   │   ├── schema.ts             # Drizzle tables (source of truth)
│   │   ├── index.ts              # node:sqlite + drizzle proxy
│   │   └── seed.ts               # Idempotent
│   ├── openapi.ts                # registry + extendZodWithOpenApi.
│   │                             #   MUST NOT import ./api (circular)
│   ├── openapi-spec.ts           # Imports ./api → buildSpec()
│   └── latency.ts                # SIMULATE_LATENCY gate
│
└── styles.css                    # Tailwind v4 entry
```

### Routing layers

- `src/routes/*.tsx` — UI routes (e.g. `bookings.tsx`, `bookings.$id.tsx`, `bookings.new.tsx`). `index.tsx` is the dispatcher dashboard.
- `src/routes/api/*.ts` — HTTP endpoints via `createFileRoute(...).server.handlers`. Thin adapters: parse, call `@/server/api/*`, return `json(...)`. Catch `z.ZodError` → HTTP 400.
- `src/routeTree.gen.ts` — generated by the TanStack router plugin; do not hand-edit.
- `src/router.tsx` — `getRouter()` factory.

### Server resource modules (`src/server/api/`)

Each resource file (`bookings.ts`, `customers.ts`, `sailings.ts`, `terminals.ts`, `vessels.ts`) does three things in one place:

1. Defines Zod schemas with `.openapi(...)` annotations.
2. Calls `registry.register(...)` and `registry.registerPath(...)` at module load — these are **side effects**.
3. Exports data functions invoked by route handlers.

`src/server/api/index.ts` imports every resource for the side-effect registration. **If you add a new resource module, import it there too — otherwise its paths/schemas won't appear in the OpenAPI spec.**

### OpenAPI generation

- `src/server/openapi.ts` calls `extendZodWithOpenApi(z)` and exports `registry`. **Must not** import from `./api` — that creates a circular dep that re-orders evaluation and silently disables `.openapi()` on Zod schemas.
- `src/server/openapi-spec.ts` imports `./api` (to trigger registrations) and exposes `buildSpec()`.
- Spec served at `src/routes/api/openapi[.]json.ts`; docs UI at `src/routes/api/docs.tsx`.

### Database (`src/server/db/`)

- `schema.ts` — Drizzle SQLite tables: `customers`, `vessels`, `terminals`, `sailings`, `bookings`. Inferred types exported.
- `index.ts` — opens `node:sqlite` `DatabaseSync`, wraps via `drizzle-orm/sqlite-proxy`. Exports `db` and `rawSqlite` (the latter used by `scripts/setup.ts` for `CREATE TABLE IF NOT EXISTS`).
- `seed.ts` — invoked by `scripts/setup.ts` after table creation; idempotent (only seeds when `bookings` is empty).
- `DATABASE_URL` defaults to `file:./local.db`; no `.env` needed.
- `sqlite-proxy` does not return rowcounts, so `updateBooking` re-fetches the row after `UPDATE` instead of relying on affected-rows.

### Simulated network latency

Every API route sleeps 200–300 ms before responding (see `src/server/latency.ts`) to mimic production. Disable with `SIMULATE_LATENCY=false` for performance traces.

### Build pipeline (`vite.config.ts`)

Plugins, in order: `viteTsConfigPaths`, `tailwindcss` (Tailwind v4 via Vite plugin), `tanstackStart`, `nitro` (externals: `node:*`), `viteReact`. Path alias `@/* → ./src/*` (mirrored in `tsconfig.json`).

### UI library: NavAIgator

`@dfds-ui/navaigator` (currently `1.1.1`) is the company-skinned React UI library. Ships its own utility stylesheet; mix freely with Tailwind v4. Browse at <https://nav-a-igator.vercel.app/> or via the `navaigator` MCP server.

The library is **pre-1.0 and intentionally janky** — wrong contrast in dark surfaces, missing focus rings, lying TS types, missing-but-expected props. Don't silently paper over these. Log issues in `BUGS.md` at the repo root with component, expected vs. actual, and a one-line repro.

### Claude tooling

- `.claude/settings.json` registers a `PreToolUse` Bash hook (`.claude/hooks/block-dangerous-git.sh`) and asks for confirmation on all `git *` commands. Don't bypass it.
- `.mcp.json` declares an HTTP MCP server `navaigator` at `https://nav-a-igator.vercel.app/mcp`.
- `.temp/` is gitignored scratch space — read/write freely; nothing there survives a clean checkout.

## Conventions

### Auto-imports

A subset of common identifiers is injected by `unplugin-auto-import` (config: `auto-import.config.ts`, generated types: `auto-imports.d.ts`). Don't write `import` statements for names listed there.

Includes most React hooks, broad NavAIgator primitive coverage (`Button`, `TextInput`, `Select*`, `Card*`, `Dialog*`, `Drawer*`, `Table*`, etc.), `cn`, `zodResolver`, `FieldError`/`FieldLabel`, `Link`/`useNavigate`/`getRouteApi`, and locals (`StatusBadge`, `STATUS_META`, `BOOKING_STATUSES`).

**Deliberately not auto-imported** (DOM/Web API name collisions): `Text`, `Notification`. Import explicitly.

**Caveat — route files need explicit imports anyway.** TanStack Start emits a `?tsr-split=component` chunk per route component; the auto-import transform doesn't reach those chunks — symbols become `ReferenceError` at SSR. So inside `src/routes/*.tsx`, always write explicit imports for everything used. Auto-imports are intended for `src/components/`, `src/hooks/`, `src/lib/`.

When adding a new common identifier, edit `auto-import.config.ts` rather than littering imports.

### File & code organization

- One component per file; PascalCase filenames for components.
- Co-locate styles, tests, types with the component. Group feature-specific components by feature.
- Flat over nested; no generic `helpers/` folder. Business logic in hooks or `utils`.
- Prefer absolute imports (`@/Gallery`) over relative (`../../Gallery`) when not in same folder.
- Reach for `@dfds-ui/navaigator` first for primitives, then `src/components/generic/`, before falling back to raw HTML — use `<Button>` not `<button>`, `<TextInput>` not `<input>`. If a primitive is missing from both, add to `src/components/generic/`.

### TypeScript

- Use `type`, not `interface`.
- Compose with `Pick`/`Omit`/`Partial` rather than inheritance.
- Keep types close to use; export from a shared module only when reused.

### Forms

Use `react-hook-form` + `zodResolver`. Don't roll bespoke `useState` setters.

- Schema: plain Zod; infer form type via `z.infer`. Shared schemas (create/edit) go in `src/lib/` (see `src/lib/booking-form-schema.ts`).
- Do **not** import Zod schemas from `src/server/api/*` into client code — those modules pull in `drizzle-orm`. Mirror what's needed in a plain-Zod client schema.
- `register("field")` for native inputs; `Controller` for controlled non-input components (e.g. NavAIgator `Select`).
- Add `noValidate` to `<form>` so Zod errors aren't pre-empted by browser native popups.
- Numeric inputs: `register("weightKg", { valueAsNumber: true })`.
- Errors inline: `errorMessage={errors.X?.message}` + `status={errors.X ? "error" : undefined}` on `TextInput`; `<FieldError>` (with `status="error"` on `SelectTrigger`) under `Select`s.
- When seeding from a fetched record, mount the form **after** the record loads and pass as `defaultValues`. Avoid `useState({...})` + `useEffect(reset(...))` — Radix `Select` rejects empty-string controlled values and gets stuck in uncontrolled mode (BUGS.md #4).

### Naming

- Functions are verbs (`fetchUserData`); variables are nouns (`userProfile`).
- Booleans start with `is`/`has`/`should`.
- camelCase for vars/functions, PascalCase for components/types.
- No abbreviations unless universal (`index`, not `idx`); no redundant suffixes (`user`, not `userObject`).

### Early-return spacing

Add a blank line after a single-line `return` (including guard clauses) before the next statement.

```typescript
if (!id) return;

const item = await api.getItem(id);
```

### Code Documentation

Self-documenting code; only comment non-obvious _why_. JSDoc public APIs. Use `/* */` for multiline; do not stack `//` lines.

If code is non-trivial to understand at a glance — dense logic, subtle invariants, non-obvious algorithms, tricky edge cases — add a short comment explaining what it does and why. Optimize for the next reader.

Annotate every `useMemo` / `useCallback` with a one-line comment stating the rationale (expensive compute, stable reference for deps, preventing child re-renders). Without a stated reason, the memoization is assumed unjustified and a candidate for removal.

```typescript
const counts = useMemo(() => {
  // memo used to avoid re-calculating counts on every render.
  const acc = { pending: 0, confirmed: 0 };
  for (const b of bookings ?? []) acc[b.status]++;
  return acc;
}, [bookings]);
```

### Commit messages

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `<type>[scope]: <description>`. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`. Append `!` for breaking changes.

### Response style

Be succinct. Lead with the answer. Drop filler ("just", "really", "basically"), pleasantries, and hedging when confident. Show a code snippet rather than describing it.

## Quick Reference

- **Before adding imports**: Check `auto-import.config.ts` first
- **In `src/routes/*.tsx`**: Always write explicit imports (auto-imports don't reach the `?tsr-split=component` chunks)
- **For routing**: Use TanStack Router (`Link`, `useNavigate`, `getRouteApi` from `@tanstack/react-router`)
- **Before creating a new component**: Reach for `@dfds-ui/navaigator` first, then `src/components/generic/`
- **Before using raw HTML elements**: Use NavAIgator or `src/components/generic/` primitives (`<Button>` not `<button>`, `<TextInput>` not `<input>`)
- **For types**: Use `type` not `interface`; compose with `Pick`/`Omit`/`Partial`
- **For server state**: Use TanStack Query
- **For HTTP**: Use `ky` via `src/lib/api.ts`
- **For forms**: Use `react-hook-form` + `zodResolver`
- **For validation**: Use Zod (mirror server schemas in `src/lib/` — never import from `src/server/api/*` in client code)
- **For styling**: Use Tailwind CSS v4 as the default choice; mix with NavAIgator's utility stylesheet
- **For DB access**: Use Drizzle (`src/server/db/`); `schema.ts` is the source of truth
- **For new server resources**: Add side-effect import to `src/server/api/index.ts` so OpenAPI picks it up
- **For NavAIgator bugs**: Log in `BUGS.md` — don't paper over them
- **For commits**: Follow Conventional Commits format
- **After code changes**: Run `pnpm check` to verify no errors
- **After single-line returns**: Add a blank line before the next statement
- **For multiline comments**: Use `/* */` block style, not stacked `//` lines
- **For `useMemo` / `useCallback`**: Annotate with a one-line rationale, or remove
- **AI responses**: Be succinct — no filler, no pleasantries, lead with the answer
