import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { listCustomers } from "@/server/api/customers";
import { simulateLatency } from "@/server/latency";

export const Route = createFileRoute("/api/customers")({
  server: {
    handlers: {
      GET: async () => {
        await simulateLatency();
        return json(await listCustomers());
      },
    },
  },
});
