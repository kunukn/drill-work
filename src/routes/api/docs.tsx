import { createFileRoute } from "@tanstack/react-router";

const SWAGGER_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Freight Bookings API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <div id="swagger"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.addEventListener("load", function () {
        window.ui = SwaggerUIBundle({
          url: "/api/openapi.json",
          dom_id: "#swagger",
          deepLinking: true,
          docExpansion: "list",
          tryItOutEnabled: true,
        });
      });
    </script>
  </body>
</html>`;

export const Route = createFileRoute("/api/docs")({
  server: {
    handlers: {
      GET: () =>
        new Response(SWAGGER_HTML, {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    },
  },
});
