import { createFileRoute } from "@tanstack/react-router";
import { BookingNew } from "@/components/bookings/BookingNew";

export const Route = createFileRoute("/bookings/new")({
  component: BookingNew,
});
