import { Notification, Text } from "@dfds-ui/navaigator";
import { useForm } from "react-hook-form";
import { useCreateBooking, useCustomers, useVessels } from "@/lib/api";
import {
  BookingFormSchema,
  type BookingFormValues,
} from "@/lib/booking-form-schema";
import { BookingFields } from "@/components/bookings/BookingFields";

export function BookingNew() {
  const navigate = useNavigate();
  const customersQuery = useCustomers();
  const vesselsQuery = useVessels();
  const createBooking = useCreateBooking();

  const customers = customersQuery.data ?? [];
  const vessels = vesselsQuery.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: {
      customerId: "",
      vesselId: "",
      origin: "",
      destination: "",
      cargoType: "",
      weightKg: 0,
      status: "pending",
      departureAt: "",
      arrivalAt: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createBooking.mutateAsync(values);
      toast.success("Booking created");
      navigate({ to: "/bookings" });
    } catch {
      // error surfaced via createBooking.error
    }
  });

  const apiError = createBooking.error?.message ?? null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-baseline gap-4 mb-6">
        <Button asChild variant="link" size="sm">
          <Link to="/bookings">← Back to Bookings</Link>
        </Button>
        <Text variant="heading-xl" asChild>
          <h1>New Booking</h1>
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
          includeStatus={false}
        />

        <div className="pt-4 flex gap-3">
          <Button
            type="submit"
            loading={createBooking.isPending}
            disabled={createBooking.isPending}
          >
            {createBooking.isPending ? "Creating…" : "Create Booking"}
          </Button>
          <Button asChild variant="ghost-primary">
            <Link to="/bookings">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
