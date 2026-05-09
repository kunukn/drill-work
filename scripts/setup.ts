// Run before `vite dev` and `vite build`. Idempotent:
//  1. Asserts Node ≥22 (required for `node:sqlite`).
//  2. Defaults DATABASE_URL so no .env file is needed.
//  3. Creates tables if missing.
//  4. Seeds if the bookings table is empty.

const requiredMajor = 22;
const major = Number(process.versions.node.split(".")[0]);
if (Number.isNaN(major) || major < requiredMajor) {
  console.error(
    `\n  This project requires Node ${requiredMajor}+ (found ${process.versions.node}).` +
      `\n  node:sqlite is only available on 22.x and above.` +
      `\n  Try: nvm install 22 && nvm use 22\n`,
  );
  process.exit(1);
}

process.env.DATABASE_URL ??= "file:./local.db";

const { rawSqlite } = await import("../src/server/db/index.ts");
const { seed } = await import("../src/server/db/seed.ts");

rawSqlite.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    country TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vessels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capacity_teu INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS terminals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    unlocode TEXT
  );

  CREATE TABLE IF NOT EXISTS sailings (
    id TEXT PRIMARY KEY,
    vessel_id TEXT NOT NULL REFERENCES vessels(id),
    from_terminal_id TEXT NOT NULL REFERENCES terminals(id),
    to_terminal_id TEXT NOT NULL REFERENCES terminals(id),
    departure_at TEXT NOT NULL,
    arrival_at TEXT NOT NULL,
    capacity_kg_remaining INTEGER NOT NULL,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id),
    vessel_id TEXT NOT NULL REFERENCES vessels(id),
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    cargo_type TEXT NOT NULL,
    weight_kg INTEGER NOT NULL,
    status TEXT NOT NULL,
    departure_at TEXT NOT NULL,
    arrival_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

if (process.env.SKIP_SEED === "1") {
  console.log("↷ SKIP_SEED=1 — tables created, seed skipped");
} else {
  await seed();
}

console.log("✔ DB ready at", process.env.DATABASE_URL);

export {};

