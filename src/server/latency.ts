/* Adds artificial latency to every API route so the dev experience
   matches prod and optimistic-update / loading-state code actually
   exercises. Disable with `SIMULATE_LATENCY=false` for perf traces. */
const MIN_MS = 200;
const MAX_MS = 300;

export async function simulateLatency(): Promise<void> {
  if (process.env.SIMULATE_LATENCY === "false") return;

  const ms = MIN_MS + Math.random() * (MAX_MS - MIN_MS);
  await new Promise((resolve) => setTimeout(resolve, ms));
}
