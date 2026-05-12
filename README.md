# Drill work

Internal ops tool for managing freight bookings — customers, vessels, terminals, sailings, and the bookings that tie them together. Built as a coding drill on TanStack Start (React 19 + Vite + Nitro) with a co-located server and SQLite via `node:sqlite`.

## Getting started

Pick one of the two options below:

- **Option A — Basic (host install).** Fastest if you already have Node 22 + pnpm.
- **Option B — Sandbox (Docker).** Recommended if you don't want to install Node/pnpm on your host or prefer running the project in an isolated container.

---

## Option A — Basic install (host)

Requires Node **>=22** (uses `node:sqlite`) and pnpm.

```bash
pnpm install --ignore-scripts   # block any dep's install-time scripts
pnpm prepare                    # install husky git hooks (our own trusted script)
pnpm predev                     # create + seed local.db
pnpm dev                        # start dev server on http://localhost:3000
```

Open <http://localhost:3000>.

**Why `--ignore-scripts`?** npm lifecycle hooks (`preinstall`, `postinstall`, `prepare`, `install`) on dependencies execute arbitrary code on your machine the moment they are installed — the primary vector behind recent supply-chain attacks (see [docs/SUPPLY_CHAIN_AUDIT.md](docs/SUPPLY_CHAIN_AUDIT.md)). This project has **no native-build dependencies**, so disabling them is safe; the only legitimate hook is our own `prepare → husky`, which we then run explicitly as a trusted step.

`pnpm predev` runs [scripts/setup.ts](scripts/setup.ts) to create the SQLite tables in `local.db` and seed them with data. Subsequent runs: just `pnpm dev` (DB is already seeded). To wipe and reseed, run `pnpm db:reset`. To restart with the initial seed, run `pnpm dev:new`.

---

## Option B — Sandbox install (Docker)

Requires Docker Desktop or Docker Engine. No Node install needed — everything runs inside a container, with the SQLite database persisted in a named volume.

```bash
docker compose up --build
```

Open <http://localhost:3000>. Stop with `Ctrl-C`.

- `docker compose down` — stop and remove the container (DB persists).
- `docker compose down -v` — also wipe the DB volume to reseed from scratch.
- After adding a dependency, rebuild the image with `docker compose up --build` so the new package is installed inside the container.

---

## Simulated network latency

Every API route sleeps for a random 200–300 ms before responding (see [src/server/latency.ts](src/server/latency.ts)). This mimics realistic production network conditions during development, so loading states, optimistic UI, and request batching behave like they will in the wild — instead of being hidden behind localhost's sub-millisecond round-trips.

To disable it (e.g. when debugging or running performance traces), set `SIMULATE_LATENCY=false` in your environment before starting the dev server.

---

## Business objectives

Maximize business value by surfacing the information ops staff act on most often, on a single landing page.

The dashboard ([src/routes/index.tsx](src/routes/index.tsx)) is a **triage screen for an ops dispatcher**, answering three questions in order:

1. **What's the shape of the book of business?** — Status overview: booking counts per status, each a one-click drill-down into the filtered list.
2. **What's on fire?** — Needs attention: pending bookings departing within 48 hours, and in-transit bookings past their expected arrival.
3. **What's coming?** — Upcoming departures (next 7 days): pending and confirmed bookings, sorted by departure time.

The remaining routes (bookings list, detail, create, edit) are CRUD screens that exist to keep the data behind the dashboard accurate and up to date.

## Developer objectives

Keep the developer feedback loop fast and the main branch healthy by catching issues at the earliest possible point — the shift-left philosophy — so problems are cheap to fix.

The philosophy: pick the fastest correct tool for each step so the guard rails stay sub-second and never become a bottleneck. Format on commit, typecheck + lint in parallel on push — only clean code reaches the remote. A test suite is the obvious next addition as the project grows.

## Auto-imports

Common symbols are made available as ambient globals via [`unplugin-auto-import`](https://github.com/unplugin/unplugin-auto-import)
Configured in [auto-import.config.ts](auto-import.config.ts):

## Trade-offs made

Half-day brief; deliberate cuts:

- **No tests.** Brief noted no test runner; Strategy: `vitest` + `@testing-library/react` for components, integration tests against the same `node:sqlite` setup the seed script uses.
- **`BookingsList` reads its own search params via `getRouteApi`.** Colocated with its only route; would lift to props if a second consumer appeared.
- **Bookings link to a vessel, not a sailing.** [src/server/db/schema.ts](src/server/db/schema.ts) keeps `bookings.vesselId` without a `sailingId` FK. Adding one would let the UI surface the exact sailing (route, departure, capacity) a booking is on, but it's a data-model change with migration and seed fallout — out of scope for the brief.

## AI pairing

AI is treated as another guard rail in the shift-left loop:

- **Bug log** — known issues in UI library and elsewhere are tracked in [BUGS.md](BUGS.md). Ask AI to append new entries when you spot one.
- **Instructions** — [.github/copilot-instructions.md](.github/copilot-instructions.md) is the canonical guide to commands, architecture, and conventions; [CLAUDE.md](CLAUDE.md) imports it so Claude Code and GitHub Copilot share one source of truth.
- **Runtime parity** — a browser MCP (e.g. Playwright MCP) lets the assistant drive the running app, so suggestions match what actually renders.
