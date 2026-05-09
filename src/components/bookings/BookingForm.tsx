import { Notification, Text } from "@dfds-ui/navaigator";
import { useForm } from "react-hook-form";
import {
  useDeleteBooking,
  useUpdateBooking,
  type BookingT,
  type CustomerT,
  type VesselT,
} from "@/lib/api";
import {
  BookingFormSchema,
  type BookingFormValues,
} from "@/lib/booking-form-schema";
import { BookingFields } from "@/components/bookings/BookingFields";

/* `<input type="datetime-local">` requires `YYYY-MM-DDTHH:MM` (no seconds,
   no timezone). SQLite may return the timestamp space-separated; normalize
   the separator and trim sub-minute precision. */
function toLocalInput(iso: string) {
  return iso.replace(" ", "T").slice(0, 16);
}

type BookingFormProps = {
  booking: BookingT;
  customers: CustomerT[];
  vessels: VesselT[];
};

export function BookingForm({ booking, customers, vessels }: BookingFormProps) {
  const navigate = useNavigate();
  const updateBooking = useUpdateBooking(booking.id);
  const deleteBooking = useDeleteBooking(booking.id);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: {
      customerId: booking.customerId,
      vesselId: booking.vesselId,
      origin: booking.origin,
      destination: booking.destination,
      cargoType: booking.cargoType,
      weightKg: booking.weightKg,
      status: booking.status,
      departureAt: toLocalInput(booking.departureAt),
      arrivalAt: toLocalInput(booking.arrivalAt),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateBooking.mutateAsync(values);
      toast.success("Booking updated");
      navigate({ to: "/bookings" });
    } catch {
      // error surfaced via updateBooking.error
    }
  });

  const handleDelete = async () => {
    try {
      await deleteBooking.mutateAsync();
      toast.success("Booking deleted");
      setDeleteOpen(false);
      navigate({ to: "/bookings" });
    } catch {
      // error surfaced via deleteBooking.error
    }
  };

  const apiError =
    updateBooking.error?.message ?? deleteBooking.error?.message ?? null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="link" size="sm">
          <Link to="/bookings">← Back to Bookings</Link>
        </Button>
        <Text variant="heading-xl" asChild>
          <h1>Booking: {booking.id}</h1>
        </Text>
      </div>

      {apiError && (
        <div className="mb-4">
          <Notification variant="error" title="Error" description={apiError} />
        </div>
      )}

      <form
        onSubmit={onSubmit}
        noValidate
        className="bg-white p-6 rounded shadow-sm border space-y-4"
      >
        <BookingFields
          control={control}
          register={register}
          errors={errors}
          customers={customers}
          vessels={vessels}
          includeStatus
        />

        <div className="pt-4 flex gap-3 items-center">
          <Button
            type="submit"
            loading={updateBooking.isPending}
            disabled={updateBooking.isPending}
          >
            {updateBooking.isPending ? "Saving…" : "Save Changes"}
          </Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="secondary">
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Delete booking?</DialogTitle>
                <DialogDescription>
                  This permanently removes booking {booking.id} (
                  {booking.origin} → {booking.destination}).
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost-primary">
                    Cancel
                  </Button>
                </DialogClose>
                {/* Per BUGS.md #2: NavAIgator has no destructive variant —
                    secondary is the closest available. */}
                <Button
                  type="button"
                  variant="secondary"
                  loading={deleteBooking.isPending}
                  disabled={deleteBooking.isPending}
                  onClick={handleDelete}
                >
                  {deleteBooking.isPending ? "Deleting…" : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button asChild variant="ghost-primary">
            <Link to="/bookings">Back</Link>
          </Button>
        </div>
      </form>

      <Text variant="body-xs" className="text-gray-400 mt-4 block">
        Created: {new Date(booking.createdAt).toLocaleString()}
      </Text>
    </div>
  );
}
