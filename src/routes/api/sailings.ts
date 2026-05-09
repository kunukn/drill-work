import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { z } from "zod";
import { listSailings } from "@/server/api/sailings";
import { simulateLatency } from "@/server/latency";

export const Route = createFileRoute("/api/sailings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await simulateLatency();
        try {
          return json(await listSailings(new URL(request.url)));
        } catch (err) {
          if (err instanceof z.ZodError) {
            return json({ error: err.message }, { status: 400 });
          }
          throw err;
        }
      },
    },
  },
});
