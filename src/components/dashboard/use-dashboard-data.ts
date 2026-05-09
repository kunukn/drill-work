import {
  useBookings,
  useCustomers,
  useSailings,
  useTerminals,
  useVessels,
  type BookingT,
  type SailingT,
  type TerminalT,
  type VesselT,
} from "@/lib/api";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/* Reference data (customers, vessels, sailings, terminals) changes rarely;
   only bookings need a polling refetch for live status. */
const REFETCH_BOOKINGS_MS = 30_000;
const STALE_REFERENCE_MS = 5 * 60 * 1000;

export type DashboardData = {
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  counts: Record<BookingT["status"], number>;
  needsAttention: BookingT[];
  upcoming: BookingT[];
  customerName: (id: string) => string;
  vesselName: (id: string) => string;
  bookings: BookingT[] | undefined;
  sailings: SailingT[];
  vessels: VesselT[];
  terminals: TerminalT[];
};

export function useDashboardData(): DashboardData {
  const bookingsQuery = useBookings(undefined, {
    refetchInterval: REFETCH_BOOKINGS_MS,
  });
  const customersQuery = useCustomers({ staleTime: STALE_REFERENCE_MS });
  const vesselsQuery = useVessels({ staleTime: STALE_REFERENCE_MS });
  const sailingsQuery = useSailings(undefined, {
    staleTime: STALE_REFERENCE_MS,
  });
  const terminalsQuery = useTerminals({ staleTime: STALE_REFERENCE_MS });

  const lastUpdated =
    bookingsQuery.dataUpdatedAt > 0
      ? new Date(bookingsQuery.dataUpdatedAt).toLocaleTimeString()
      : null;

  const bookings = bookingsQuery.data;
  const customers = customersQuery.data ?? [];
  const vessels = vesselsQuery.data ?? [];
  const sailings = sailingsQuery.data ?? [];
  const terminals = terminalsQuery.data ?? [];

  const loading = bookingsQuery.isLoading;
  const error = bookingsQuery.error?.message ?? null;

  const customerName = (id: string) =>
    customers.find((c) => c.id === id)?.name ?? id;
  const vesselName = (id: string) =>
    vessels.find((v) => v.id === id)?.name ?? id;

  const counts = useMemo(() => {
    // memo used to avoid re-calculating counts on every render.

    const acc: Record<BookingT["status"], number> = {
      pending: 0,
      confirmed: 0,
      in_transit: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const b of bookings ?? []) acc[b.status]++;

    return acc;
  }, [bookings]);

  const { needsAttention, upcoming } = useMemo(() => {
    /* memo used to avoid re-deriving two filtered+sorted lists from the
       full bookings array on every render. Recomputes only when bookings
       change (every ~30s via refetch). */
    const now = Date.now();
    const in48h = now + 2 * DAY;
    const in7d = now + 7 * DAY;

    const list = bookings ?? [];
    /* "Needs attention": pending bookings departing within 48h (allowing a
       1-day grace window for slightly-overdue pendings), plus any in-transit
       bookings whose arrival time has already passed. */
    const attention = list
      .filter((b) => {
        const dep = Date.parse(b.departureAt);
        const arr = Date.parse(b.arrivalAt);
        if (b.status === "pending" && dep <= in48h && dep >= now - DAY)
          return true;
        if (b.status === "in_transit" && arr < now) return true;

        return false;
      })
      .sort((a, b) => Date.parse(a.departureAt) - Date.parse(b.departureAt))
      .slice(0, 10);

    const next = list
      .filter((b) => {
        if (b.status !== "pending" && b.status !== "confirmed") return false;

        const dep = Date.parse(b.departureAt);

        return dep >= now && dep <= in7d;
      })
      .sort((a, b) => Date.parse(a.departureAt) - Date.parse(b.departureAt))
      .slice(0, 10);

    return { needsAttention: attention, upcoming: next };
  }, [bookings]);

  return {
    loading,
    error,
    lastUpdated,
    counts,
    needsAttention,
    upcoming,
    customerName,
    vesselName,
    bookings,
    sailings,
    vessels,
    terminals,
  };
}
