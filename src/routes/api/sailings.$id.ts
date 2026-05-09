import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { getSailing } from "@/server/api/sailings";
import { simulateLatency } from "@/server/latency";

export const Route = createFileRoute("/api/sailings/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        await simulateLatency();
        const sailing = await getSailing(params.id);
        if (!sailing) return json({ error: "Not found" }, { status: 404 });

        return json(sailing);
      },
    },
  },
});
