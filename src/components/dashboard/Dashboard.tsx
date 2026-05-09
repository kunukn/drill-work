import { Notification, Text } from "@dfds-ui/navaigator";
import { DashboardTable } from "@/components/dashboard/DashboardTable";
import { NowBoardingTicker } from "@/components/dashboard/NowBoardingTicker";
import { StatusCountsGrid } from "@/components/dashboard/StatusCountsGrid";
import { useDashboardData } from "@/components/dashboard/use-dashboard-data";
import type { BookingT } from "@/lib/api";

/* Stable empty-array reference — avoids re-allocating an `[]` on every
   render while bookings are still loading. */
const EMPTY_BOOKINGS: BookingT[] = [];

export function Dashboard() {
  const {
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
  } = useDashboardData();

  return (
    <div>
      <div className="mb-6">
        <Text variant="heading-xl" asChild>
          <h1>Freight Operations Dashboard</h1>
        </Text>
        <div className="flex flex-wrap gap-1 items-baseline mt-2 text-gray-600">
          {lastUpdated && (
            <p className=" tabular-nums">
              Last updated: {lastUpdated} — Auto refreshes every 30 seconds.
            </p>
          )}
          <p>— Status overview, attention items, and upcoming departures.</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500">
          <LoadingSpinner size="md" />
          <span>Loading dashboard…</span>
        </div>
      )}
      {error && (
        <Notification
          variant="error"
          title="Couldn't load dashboard"
          description={error}
        />
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-8">
          <StatusCountsGrid counts={counts} />

          <NowBoardingTicker
            sailings={sailings}
            bookings={bookings ?? EMPTY_BOOKINGS}
            vessels={vessels}
            terminals={terminals}
          />

          <DashboardTable
            title="Needs attention"
            subtitle="Pending bookings departing within 48 hours, and in-transit bookings past their arrival time."
            empty="All clear — nothing needs attention right now. ✓"
            rows={needsAttention}
            customerName={customerName}
            vesselName={vesselName}
          />

          <DashboardTable
            title="Upcoming departures (next 7 days)"
            subtitle="Pending and confirmed bookings sorted by departure."
            empty="No departures in the next 7 days."
            rows={upcoming}
            customerName={customerName}
            vesselName={vesselName}
          />
        </div>
      )}
    </div>
  );
}
