import { createRootRoute } from "@tanstack/react-router";
import { NotFound } from "@/components/layout/NotFound";
import { RootComponent } from "@/components/layout/RootComponent";
import { RootDocument } from "@/components/layout/RootDocument";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Freight Operations" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    /* Dev-only CSS-debugging overlay: toggle rainbow element outlines.
       Source: public/rainbow.js. */
    scripts: import.meta.env.DEV ? [{ src: "/rainbow.js" }] : [],
  }),
  /* SSR document shell: <html>/<head>/<body>. Rendered once on the server,
     wraps the streamed app output. */
  shellComponent: RootDocument,
  /* App root inside the shell: providers (QueryClient), 
     <Outlet /> for child routes. */
  component: RootComponent,
  notFoundComponent: NotFound,
});
