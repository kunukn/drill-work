import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { terminals } from "@/server/db/schema";
import { registry } from "@/server/openapi";

export const Terminal = z
  .object({
    id: z.string(),
    name: z.string(),
    country: z.string(),
    unlocode: z.string().nullable(),
  })
  .openapi("Terminal");

const ListQuery = z.object({ country: z.string().length(2).optional() });

registry.register("Terminal", Terminal);

registry.registerPath({
  method: "get",
  path: "/api/terminals",
  tags: ["Terminals"],
  summary: "List terminals (DFDS port calls)",
  request: { query: ListQuery },
  responses: {
    200: {
      description: "All terminals, optionally filtered by ISO country code.",
      content: { "application/json": { schema: z.array(Terminal) } },
    },
  },
});

export async function listTerminals(url: URL) {
  const q = ListQuery.parse(Object.fromEntries(url.searchParams));
  const rows = q.country
    ? await db.select().from(terminals).where(eq(terminals.country, q.country))
    : await db.select().from(terminals);
  return z.array(Terminal).parse(rows);
}
