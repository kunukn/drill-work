import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { z } from "zod";
import {
  deleteBooking,
  getBooking,
  updateBooking,
} from "@/server/api/bookings";
import { simulateLatency } from "@/server/latency";

export const Route = createFileRoute("/api/bookings/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        await simulateLatency();
        const booking = await getBooking(params.id);
        if (!booking) return json({ error: "Not found" }, { status: 404 });

        return json(booking);
      },
      PATCH: async ({ params, request }) => {
        await simulateLatency();
        try {
          const body = await request.json();
          const existing = await getBooking(params.id);
          if (!existing) return json({ error: "Not found" }, { status: 404 });

          const updated = await updateBooking(params.id, body);
          return json(updated);
        } catch (err) {
          if (err instanceof z.ZodError) {
            return json({ error: err.message }, { status: 400 });
          }
          throw err;
        }
      },
      DELETE: async ({ params }) => {
        await simulateLatency();
        const ok = await deleteBooking(params.id);
        if (!ok) return json({ error: "Not found" }, { status: 404 });

        return new Response(null, { status: 204 });
      },
    },
  },
});
