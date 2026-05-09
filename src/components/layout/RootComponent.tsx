import { Outlet } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { getQueryClient } from "@/lib/queryClient";

export function RootComponent() {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
