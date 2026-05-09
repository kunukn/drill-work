import { z } from "zod";
import { db } from "@/server/db";
import { customers } from "@/server/db/schema";
import { registry } from "@/server/openapi";

export const Customer = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    country: z.string(),
    createdAt: z.string(),
  })
  .openapi("Customer");

registry.register("Customer", Customer);

registry.registerPath({
  method: "get",
  path: "/api/customers",
  tags: ["Customers"],
  summary: "List customers",
  responses: {
    200: {
      description: "All customers.",
      content: { "application/json": { schema: z.array(Customer) } },
    },
  },
});

export async function listCustomers() {
  const rows = await db.select().from(customers);
  return z.array(Customer).parse(rows);
}
