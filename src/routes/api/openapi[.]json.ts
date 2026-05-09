import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { buildSpec } from "@/server/openapi-spec";

export const Route = createFileRoute("/api/openapi.json")({
  server: {
    handlers: {
      GET: () => json(buildSpec()),
    },
  },
});
