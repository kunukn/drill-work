import type { BookingT, SailingT, TerminalT, VesselT } from "@/lib/api";

type NowBoardingTickerProps = {
  sailings: SailingT[];
  bookings: BookingT[];
  vessels: VesselT[];
  terminals: TerminalT[];
};

export function NowBoardingTicker({
  sailings,
  bookings,
  vessels,
  terminals,
}: NowBoardingTickerProps) {
  const boarding = useMemo(
    // memo used to avoid re-filtering and re-sorting sailings on every render.
    () =>
      sailings
        .filter((s) => s.status === "boarding")
        .sort((a, b) => Date.parse(a.departureAt) - Date.parse(b.departureAt)),
    [sailings],
  );

  if (boarding.length === 0) return null;

  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
    >
      <div className="flex items-center gap-2 font-semibold">
        <span
          className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"
          aria-hidden="true"
        />
        Now boarding · {boarding.length} sailing
        {boarding.length === 1 ? "" : "s"}
      </div>
      <ul className="flex flex-col divide-y divide-blue-100 mt-2">
        {boarding.map((s) => {
          const vesselName =
            vessels.find((v) => v.id === s.vesselId)?.name ?? s.vesselId;
          const fromName =
            terminals.find((t) => t.id === s.fromTerminalId)?.name ??
            s.fromTerminalId;
          const toName =
            terminals.find((t) => t.id === s.toTerminalId)?.name ??
            s.toTerminalId;

          /* Sum weight of all active (non-cancelled) bookings for this exact
             sailing (vessel + departure time match). The sailing only stores
             remaining capacity, so total capacity = booked + remaining. */
          let booked = 0;
          for (const b of bookings) {
            if (b.status === "cancelled") continue;
            if (b.vesselId === s.vesselId && b.departureAt === s.departureAt) {
              booked += b.weightKg;
            }
          }
          const total = booked + s.capacityKgRemaining;
          const pct = total > 0 ? Math.round((booked / total) * 100) : 0;
          const departure = new Date(s.departureAt).toLocaleTimeString(
            undefined,
            { hour: "2-digit", minute: "2-digit" },
          );

          return (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5"
            >
              <span className="font-medium">{vesselName}</span>
              <span className="text-blue-700">
                {fromName} → {toName}
              </span>
              <span className="text-blue-700">departs {departure}</span>
              <span className="ml-auto tabular-nums">{pct}% full</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
