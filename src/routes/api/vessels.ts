import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { listVessels } from "@/server/api/vessels";
import { simulateLatency } from "@/server/latency";

export const Route = createFileRoute("/api/vessels")({
  server: {
    handlers: {
      GET: async () => {
        await simulateLatency();
        return json(await listVessels());
      },
    },
  },
});
