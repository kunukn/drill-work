import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./openapi";

// Side-effect: every resource registers its paths/schemas at module load.
import "./api";

export function buildSpec() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Freight Bookings API",
      version: "1.0.0",
      description:
        "Internal API for the coding exercise. All endpoints are unauthenticated and live in-process with the Vite dev server.",
    },
    servers: [{ url: "/" }],
  });
}
