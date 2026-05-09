import { z } from "zod";
import { db } from "@/server/db";
import { vessels } from "@/server/db/schema";
import { registry } from "@/server/openapi";

export const Vessel = z
  .object({
    id: z.string(),
    name: z.string(),
    capacityTeu: z.number().int().positive(),
  })
  .openapi("Vessel");

registry.register("Vessel", Vessel);

registry.registerPath({
  method: "get",
  path: "/api/vessels",
  tags: ["Vessels"],
  summary: "List vessels",
  responses: {
    200: {
      description: "All vessels.",
      content: { "application/json": { schema: z.array(Vessel) } },
    },
  },
});

export async function listVessels() {
  const rows = await db.select().from(vessels);
  return z.array(Vessel).parse(rows);
}
