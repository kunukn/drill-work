import { createFileRoute } from "@tanstack/react-router";
import { BookingDetail } from "@/components/bookings/BookingDetail";

export const Route = createFileRoute("/bookings/$id")({
  component: BookingDetail,
});
