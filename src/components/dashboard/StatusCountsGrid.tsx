import type { BookingT } from "@/lib/api";

type StatusCountsGridProps = {
  counts: Record<BookingT["status"], number>;
};

export function StatusCountsGrid({ counts }: StatusCountsGridProps) {
  return (
    <section>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {BOOKING_STATUSES.map((s) => (
          <Link
            key={s}
            to="/bookings"
            search={{ status: s }}
            aria-label={`${counts[s]} ${STATUS_META[s].label} bookings`}
            className="flex items-center gap-3 bg-white rounded shadow-sm border p-3 hover:border-blue-500 transition-colors"
          >
            <div className="text-2xl font-bold text-gray-900 tabular-nums">
              {counts[s]}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <StatusBadge status={s} />
              <span className="text-xs text-gray-500">bookings</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
