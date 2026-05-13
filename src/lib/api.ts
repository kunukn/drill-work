import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import ky, { HTTPError } from "ky";
import type { z } from "zod";
import type { Booking } from "@/server/api/bookings";
import type { Customer } from "@/server/api/customers";
import type { Sailing } from "@/server/api/sailings";
import type { Terminal } from "@/server/api/terminals";
import type { Vessel } from "@/server/api/vessels";

/* `*T` suffix disambiguates the inferred TS type from the Zod schema
   constant of the same base name (e.g. `Booking` is the schema, `BookingT`
   is the row type). One of the few places the project's "no redundant
   suffix" rule is intentionally relaxed. */
export type BookingT = z.infer<typeof Booking>;
export type CustomerT = z.infer<typeof Customer>;
export type SailingT = z.infer<typeof Sailing>;
export type TerminalT = z.infer<typeof Terminal>;
export type VesselT = z.infer<typeof Vessel>;

type SailingsFilter = {
  vesselId?: string;
  fromTerminalId?: string;
  toTerminalId?: string;
  status?: SailingT["status"];
  from?: string;
  to?: string;
};

type BookingsFilter = {
  status?: BookingT["status"];
  customerId?: string;
  vesselId?: string;
  departureAt?: string;
};

type NewBookingBody = Omit<BookingT, "id" | "createdAt">;
type BookingPatchBody = Partial<NewBookingBody>;

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/* ky defaults fight with our setup:
   - `timeout: false` — ky's default 10s timeout would race SIMULATE_LATENCY
     and mask slow-server bugs. React Query owns cancellation via AbortSignal.
   - `retry: 0` — ky's default retries DELETE/GET/PUT on 5xx (limit 2 = 3 total
     attempts). We let TanStack Query own retry policy at the query layer;
     mutations stay non-retrying so failed writes surface immediately. */
const http = ky.extend({ timeout: false, retry: 0 });

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    const res = await http(url, init);
    /* DELETE responds 204 No Content — there's no JSON body to parse.
       Callers that pass T = void won't read the value; the cast keeps
       the generic signature honest without an extra overload. */
    if (res.status === 204) return undefined as T;

    return (await res.json()) as T;
  } catch (err) {
    if (!(err instanceof HTTPError)) throw err;
    /* ky throws HTTPError on non-2xx but its message is generic.
       Re-read the response body to surface the server's { error } string;
       fall back if the body isn't JSON (e.g. HTML error page from a proxy). */
    const body = (await err.response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new ApiError(
      err.response.status,
      body?.error ?? `Request failed: ${err.response.status}`,
    );
  }
}

/* Centralized query-key factory. Mutations invalidate by prefix
   (e.g. `["bookings"]` matches every `["bookings", <filter>]` variant),
   so keeping construction in one place keeps reads and invalidations
   in lockstep. Add a new resource here before using it in a hook. */
const queryKeys = {
  bookings: (filter?: BookingsFilter) => ["bookings", filter ?? {}] as const,
  booking: (id: string) => ["booking", id] as const,
  customers: () => ["customers"] as const,
  vessels: () => ["vessels"] as const,
  sailings: (filter?: SailingsFilter) => ["sailings", filter ?? {}] as const,
  terminals: () => ["terminals"] as const,
};

function buildBookingsUrl(filter?: BookingsFilter) {
  const params = new URLSearchParams();
  if (filter?.status) params.set("status", filter.status);
  if (filter?.customerId) params.set("customerId", filter.customerId);
  if (filter?.vesselId) params.set("vesselId", filter.vesselId);
  if (filter?.departureAt) params.set("departureAt", filter.departureAt);

  const qs = params.toString();

  return qs ? `/api/bookings?${qs}` : "/api/bookings";
}

type QueryOptions<T> = Omit<
  Partial<UseQueryOptions<T, Error>>,
  "queryKey" | "queryFn"
>;

export function useBookings(
  filter?: BookingsFilter,
  options?: QueryOptions<BookingT[]>,
) {
  return useQuery({
    queryKey: queryKeys.bookings(filter),
    queryFn: () => request<BookingT[]>(buildBookingsUrl(filter)),
    ...options,
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: queryKeys.booking(id),
    queryFn: async () => {
      try {
        return await request<BookingT>(`/api/bookings/${id}`);
      } catch (err) {
        /* Map 404 → resolved `null` instead of a query error. This shifts
           "not found" from `query.isError` into `query.data === null`, so
           callers can branch on `data` alone (loading: undefined, missing:
           null, found: BookingT) without a second error-state branch. */
        if (err instanceof ApiError && err.status === 404) return null;

        throw err;
      }
    },
  });
}

export function useCustomers(options?: QueryOptions<CustomerT[]>) {
  return useQuery({
    queryKey: queryKeys.customers(),
    queryFn: () => request<CustomerT[]>("/api/customers"),
    ...options,
  });
}

export function useVessels(options?: QueryOptions<VesselT[]>) {
  return useQuery({
    queryKey: queryKeys.vessels(),
    queryFn: () => request<VesselT[]>("/api/vessels"),
    ...options,
  });
}

function buildSailingsUrl(filter?: SailingsFilter) {
  const params = new URLSearchParams();

  if (filter?.vesselId) params.set("vesselId", filter.vesselId);
  if (filter?.fromTerminalId)
    params.set("fromTerminalId", filter.fromTerminalId);

  if (filter?.toTerminalId) params.set("toTerminalId", filter.toTerminalId);
  if (filter?.status) params.set("status", filter.status);
  if (filter?.from) params.set("from", filter.from);
  if (filter?.to) params.set("to", filter.to);

  const qs = params.toString();

  return qs ? `/api/sailings?${qs}` : "/api/sailings";
}

export function useSailings(
  filter?: SailingsFilter,
  options?: QueryOptions<SailingT[]>,
) {
  return useQuery({
    queryKey: queryKeys.sailings(filter),
    queryFn: () => request<SailingT[]>(buildSailingsUrl(filter)),
    ...options,
  });
}

export function useTerminals(options?: QueryOptions<TerminalT[]>) {
  return useQuery({
    queryKey: queryKeys.terminals(),
    queryFn: () => request<TerminalT[]>("/api/terminals"),
    ...options,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();

  /* Simplest of the three mutations. No optimistic update because:
       - We don't have an `id` until the server responds (it's generated
         server-side), so we can't synthesize a complete row to insert.
       - The user navigates to /bookings on success, where the list will
         refetch anyway — no perceived latency to mask.

     Lifecycle hooks used:
       mutationFn → POSTs the form values; receives `body` from
                    mutate(values) / mutateAsync(values)
       onSuccess  → fires on 2xx; we don't need the response payload
                    here because invalidate triggers a fresh list fetch */
  return useMutation({
    mutationFn: (body: NewBookingBody) =>
      request<BookingT>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      /* Mark all bookings lists stale → mounted views refetch and pick
         up the newly-created row from the server. Cheap and correct. */
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useUpdateBooking(id: string) {
  const qc = useQueryClient();

  /* Non-optimistic mutation. Unlike useDeleteBooking we wait for the
     server response before touching caches — PATCH may transform fields
     server-side (e.g. updatedAt timestamps), so the response is more
     trustworthy than an optimistic guess.

     Lifecycle hooks used:
       mutationFn → the async request itself; receives the variables you
                    pass to mutate(...) / mutateAsync(...)
       onSuccess  → fires only on 2xx; receives the resolved data as its
                    first arg (here: `updated`, the BookingT from the API) */
  return useMutation({
    mutationFn: (body: BookingPatchBody) =>
      request<BookingT>(`/api/bookings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: (updated) => {
      /* Seed the single-booking cache directly with the server's
         response. This avoids a follow-up GET /api/bookings/<id> —
         the detail page already has fresh data when the user revisits. */
      qc.setQueryData(queryKeys.booking(id), updated);

      /* Mark every cached ["bookings", <filter>] list as stale so any
         mounted list view refetches. We don't setQueryData here because
         the row's filter membership may have changed (e.g. status went
         pending → confirmed) — easier to let the server re-sort. */
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useDeleteBooking(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      request<void>(`/api/bookings/${id}`, { method: "DELETE" }),
    /* useMutation lifecycle for optimistic updates:
         onMutate  → fires BEFORE the request; mutate the cache optimistically
         onError   → fires if the request fails; roll back using context
         onSuccess → fires on 2xx (not used here — onSettled handles both)
         onSettled → fires after success OR error; final cache reconciliation
       The value returned from onMutate is passed back as `ctx` to onError. */
    onMutate: async () => {
      /* Optimistic update: with the simulated 200–300 ms latency, naive
         delete leaves the row visible after the user lands on /bookings.
         Snapshot every cached ["bookings", filter] variant so we can roll
         back on error, then strip the row from each. */

      /* Cancel any in-flight bookings refetches. Without this, a refetch
         that started before our optimistic write could land AFTER it and
         overwrite our optimistic state with stale server data. */
      await qc.cancelQueries({ queryKey: ["bookings"] });

      /* Snapshot the current cache for every ["bookings", <any filter>]
         entry. The list page may have multiple cached variants (status
         filter, customer filter, etc.), so we capture them all to enable
         a complete rollback if the DELETE fails. */
      const snapshot = qc.getQueriesData<BookingT[]>({
        queryKey: ["bookings"],
      });

      /* Optimistically remove the deleted row from every cached variant.
         setQueryData replaces the cached value; the UI re-renders as if
         the server had already confirmed the delete. */
      snapshot.forEach(([key, data]) =>
        qc.setQueryData(
          key,
          data?.filter((b) => b.id !== id),
        ),
      );

      /* Return value becomes the `ctx` argument in onError below. */
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      /* Rollback: restore each cache entry to its pre-mutation snapshot.
         This is why we captured the full list above instead of just one. */
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      /* Runs after BOTH success and error paths.
         - removeQueries: drop the single-booking cache (the row is gone
           on success, or stale on error — either way, refetch fresh).
         - invalidateQueries: mark all bookings lists as stale so the
           server becomes the source of truth again, replacing our
           optimistic guess with confirmed data. */
      qc.removeQueries({ queryKey: queryKeys.booking(id) });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
