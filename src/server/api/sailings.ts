import { z } from "zod";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/server/db";
import { sailings } from "@/server/db/schema";
import { registry } from "@/server/openapi";

export const SailingStatus = z
  .enum(["scheduled", "boarding", "departed", "arrived", "cancelled"])
  .openapi("SailingStatus");

export const Sailing = z
  .object({
    id: z.string(),
    vesselId: z.string(),
    fromTerminalId: z.string(),
    toTerminalId: z.string(),
    departureAt: z.string(),
    arrivalAt: z.string(),
    capacityKgRemaining: z.number().int().nonnegative(),
    status: SailingStatus,
  })
  .openapi("Sailing");

const ListQuery = z.object({
  vesselId: z.string().optional(),
  fromTerminalId: z.string().optional(),
  toTerminalId: z.string().optional(),
  status: SailingStatus.optional(),
  /** ISO timestamp — only include sailings departing at or after this time. */
  from: z.string().optional(),
  /** ISO timestamp — only include sailings departing at or before this time. */
  to: z.string().optional(),
});

registry.register("Sailing", Sailing);

registry.registerPath({
  method: "get",
  path: "/api/sailings",
  tags: ["Sailings"],
  summary: "List planned vessel sailings",
  description:
    "Returns the schedule of vessel sailings between terminals. Supports filtering by vessel, route, status, and a departure-time window.",
  request: { query: ListQuery },
  responses: {
    200: {
      description: "Matching sailings.",
      content: { "application/json": { schema: z.array(Sailing) } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/sailings/{id}",
  tags: ["Sailings"],
  summary: "Get a sailing by id",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: "The sailing.",
      content: { "application/json": { schema: Sailing } },
    },
    404: {
      description: "Not found.",
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
    },
  },
});

export async function listSailings(url: URL) {
  const q = ListQuery.parse(Object.fromEntries(url.searchParams));
  const filters = [];
  if (q.vesselId) filters.push(eq(sailings.vesselId, q.vesselId));
  if (q.fromTerminalId)
    filters.push(eq(sailings.fromTerminalId, q.fromTerminalId));
  if (q.toTerminalId) filters.push(eq(sailings.toTerminalId, q.toTerminalId));
  if (q.status) filters.push(eq(sailings.status, q.status));
  if (q.from) filters.push(gte(sailings.departureAt, q.from));
  if (q.to) filters.push(lte(sailings.departureAt, q.to));
  const rows =
    filters.length > 0
      ? await db
          .select()
          .from(sailings)
          .where(filters.length === 1 ? filters[0] : and(...filters))
      : await db.select().from(sailings);
  return z.array(Sailing).parse(rows);
}

export async function getSailing(id: string) {
  const [row] = await db.select().from(sailings).where(eq(sailings.id, id));
  if (!row) return null;

  return Sailing.parse(row);
}
