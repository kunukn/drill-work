import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// MUST run before any resource module evaluates a `.openapi(...)` call.
// Keep this file free of imports from `./api` — adding one would create a
// circular dep that re-orders evaluation and silently disables `.openapi()`.
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();
