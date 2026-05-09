import { QueryClient } from "@tanstack/react-query";

let browserClient: QueryClient | undefined;

/* SSR: a fresh client per request so cache state doesn't leak between
   users. Browser: a singleton so navigation reuses the cache instead of
   refetching everything on every render. */
export function getQueryClient() {
  if (typeof window === "undefined") {
    return new QueryClient({
      defaultOptions: {
        queries: { staleTime: 0, retry: 1 },
      },
    });
  }
  if (!browserClient) {
    browserClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 0, refetchOnWindowFocus: true, retry: 1 },
      },
    });
  }

  return browserClient;
}
