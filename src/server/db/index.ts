import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL ?? "file:./local.db";
const dbPath = databaseUrl.startsWith("file:")
  ? databaseUrl.slice(5)
  : databaseUrl;

const sqlite = new DatabaseSync(dbPath);

export const rawSqlite = sqlite;

/* sqlite-proxy expects rows as positional value arrays (not objects keyed by
   column name), so we strip keys via Object.values for both `get` and `all`.
   `run` returns no rows; we don't surface affected-row counts — see
   `updateBooking` for the workaround. */
export const db = drizzle(
  async (sql: string, params: unknown[], method: string) => {
    const stmt = sqlite.prepare(sql);
    if (method === "run") {
      stmt.run(...(params as []));
      return { rows: [] };
    }
    if (method === "get") {
      const row = stmt.get(...(params as [])) as
        | Record<string, unknown>
        | undefined;
      return { rows: row ? Object.values(row) : ([] as unknown as []) };
    }
    const rows = stmt.all(...(params as [])) as Record<string, unknown>[];
    return { rows: rows.map((r) => Object.values(r)) as unknown[][] };
  },
  { schema },
);
