import { Badge } from "@dfds-ui/navaigator";
import type { z } from "zod";
import type { Booking } from "@/server/api/bookings";

type BookingStatus = z.infer<typeof Booking>["status"];

type StatusMeta = {
  variant: "info" | "success" | "warning" | "neutral" | "danger";
  label: string;
};

export const STATUS_META: Record<BookingStatus, StatusMeta> = {
  pending: { variant: "warning", label: "Pending" },
  confirmed: { variant: "info", label: "Confirmed" },
  in_transit: { variant: "info", label: "In Transit" },
  delivered: { variant: "success", label: "Delivered" },
  cancelled: { variant: "danger", label: "Cancelled" },
};

export const BOOKING_STATUSES = Object.keys(STATUS_META) as BookingStatus[];

type StatusBadgeProps = {
  status: BookingStatus;
  size?: "sm" | "md";
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const meta = STATUS_META[status];

  return (
    <Badge variant={meta.variant} emphasis="low" size={size}>
      {meta.label}
    </Badge>
  );
}
