import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { BOOKING_STATUSES } from "@/components/generic/StatusBadge";
import { BookingsList } from "@/components/bookings/BookingsList";
import type { BookingT } from "@/lib/api";

const BookingsSearch = z.object({
  status: z
    .enum(BOOKING_STATUSES as [BookingT["status"], ...BookingT["status"][]])
    .optional(),
  customerId: z.string().optional(),
  vesselId: z.string().optional(),
  departureAt: z.string().optional(),
});

export const Route = createFileRoute("/bookings/")({
  component: BookingsList,
  validateSearch: BookingsSearch,
});
