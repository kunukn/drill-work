import { Notification, Text } from "@dfds-ui/navaigator";
import { useBookings, useCustomers, useVessels } from "@/lib/api";
import type { BookingT } from "@/lib/api";

const routeApi = getRouteApi("/bookings/");
/* Sentinel for "no filter" — Radix `<Select>` rejects `""` as an item
   value, so filter selects use this and translate it to `undefined` in
   the search-param state. See BUGS.md #4. */
const ALL = "__all__";

type SearchKey = "status" | "customerId" | "vesselId";

export function BookingsList() {
  const navigate = routeApi.useNavigate();
  const search = routeApi.useSearch();

  const setSearchValue = <K extends SearchKey>(
    key: K,
    value: K extends "status"
      ? BookingT["status"] | undefined
      : string | undefined,
  ) =>
    navigate({
      search: (prev) => ({ ...prev, [key]: value }),
    });

  const bookingsQuery = useBookings({
    status: search.status,
    customerId: search.customerId,
    vesselId: search.vesselId,
    departureAt: search.departureAt,
  });
  const customersQuery = useCustomers();
  const vesselsQuery = useVessels();

  const bookings = bookingsQuery.data ?? [];
  const loading = bookingsQuery.isLoading;
  const error = bookingsQuery.error?.message ?? null;

  /* memo: avoid O(n) .find() per row when rendering the bookings table.
     Depend on the query data directly — its identity is stable across
     renders, unlike a `?? []` fallback which allocates every time. */
  const customerById = useMemo(
    () => new Map((customersQuery.data ?? []).map((c) => [c.id, c.name])),
    [customersQuery.data],
  );
  const vesselById = useMemo(
    () => new Map((vesselsQuery.data ?? []).map((v) => [v.id, v.name])),
    [vesselsQuery.data],
  );
  const customers = customersQuery.data ?? [];
  const vessels = vesselsQuery.data ?? [];
  const customerName = (id: string) => customerById.get(id) ?? id;
  const vesselName = (id: string) => vesselById.get(id) ?? id;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Text variant="heading-xl" asChild>
          <h1>Bookings</h1>
        </Text>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link to="/bookings/new">+ New Booking</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded shadow-sm border">
        <div className="min-w-45">
          <Select
            value={search.status ?? ALL}
            onValueChange={(v) =>
              setSearchValue(
                "status",
                v === ALL ? undefined : (v as BookingT["status"]),
              )
            }
          >
            <SelectTrigger aria-label="Status filter">
              {search.status
                ? STATUS_META[search.status].label
                : "All Statuses"}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Statuses</SelectItem>
              {BOOKING_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-50">
          <Select
            value={search.customerId ?? ALL}
            onValueChange={(v) =>
              setSearchValue("customerId", v === ALL ? undefined : v)
            }
          >
            <SelectTrigger aria-label="Customer filter">
              {search.customerId
                ? customerName(search.customerId)
                : "All Customers"}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Customers</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-50">
          <Select
            value={search.vesselId ?? ALL}
            onValueChange={(v) =>
              setSearchValue("vesselId", v === ALL ? undefined : v)
            }
          >
            <SelectTrigger aria-label="Vessel filter">
              {search.vesselId ? vesselName(search.vesselId) : "All Vessels"}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Vessels</SelectItem>
              {vessels.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500">
          <LoadingSpinner size="md" />
          <span>Loading bookings…</span>
        </div>
      )}
      {error && (
        <Notification
          variant="error"
          title="Couldn't load bookings"
          description={error}
        />
      )}
      {!loading && !error && bookings.length === 0 && (
        <Notification
          variant="info"
          title="No bookings"
          description="No bookings match the current filters."
        />
      )}
      {!loading && !error && bookings.length > 0 && (
        <div className="overflow-x-auto bg-white rounded shadow-sm border">
          <Table size="sm">
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vessel</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{customerName(b.customerId)}</TableCell>
                  <TableCell>{vesselName(b.vesselId)}</TableCell>
                  <TableCell>
                    {b.origin} → {b.destination}
                  </TableCell>
                  <TableCell>{b.cargoType}</TableCell>
                  <TableCell>{b.weightKg.toLocaleString()} kg</TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(b.departureAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="link" size="sm">
                      <Link to="/bookings/$id" params={{ id: b.id }}>
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
