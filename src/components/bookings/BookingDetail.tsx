import { Notification } from "@dfds-ui/navaigator";
import { useBooking, useCustomers, useVessels } from "@/lib/api";
import { BookingForm } from "@/components/bookings/BookingForm";

const routeApi = getRouteApi("/bookings/$id");

export function BookingDetail() {
  const { id } = routeApi.useParams();

  const bookingQuery = useBooking(id);
  const customersQuery = useCustomers();
  const vesselsQuery = useVessels();

  if (bookingQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <LoadingSpinner size="md" />
        <span>Loading…</span>
      </div>
    );
  }

  /* `data === null` (not `undefined`) means the booking was looked up and
     not found — `useBooking` maps a 404 to a resolved-null query rather
     than an error. See `useBooking` in src/lib/api.ts. */
  if (bookingQuery.isSuccess && bookingQuery.data === null) {
    return (
      <div className="space-y-4">
        <Notification
          variant="error"
          title="Booking not found"
          description={`No booking exists with id ${id}.`}
        />
        <div className="flex items-baseline gap-4">
          <Button asChild variant="link" size="sm">
            <Link to="/bookings">← Back to Bookings</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!bookingQuery.data) return null;

  return (
    <BookingForm
      booking={bookingQuery.data}
      customers={customersQuery.data ?? []}
      vessels={vesselsQuery.data ?? []}
    />
  );
}
