import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import type { CustomerT, VesselT } from "@/lib/api";
import type { BookingFormValues } from "@/lib/booking-form-schema";

/* Each `<SelectTrigger>` resolves its own label via `find(...)?.name ??
   "Select…"` instead of using a `<SelectValue>` child. NavAIgator's
   trigger doesn't expose `<SelectValue>` (BUGS.md #3) — the manual
   ternary is the documented workaround, not a refactor candidate. */

type BookingFieldsProps = {
  control: Control<BookingFormValues>;
  register: UseFormRegister<BookingFormValues>;
  errors: FieldErrors<BookingFormValues>;
  customers: CustomerT[];
  vessels: VesselT[];
  /* Status is only editable on existing bookings; new bookings always
     start as `pending` and don't render the field. */
  includeStatus: boolean;
};

export function BookingFields({
  control,
  register,
  errors,
  customers,
  vessels,
  includeStatus,
}: BookingFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Controller
        control={control}
        name="customerId"
        render={({ field, fieldState: { error } }) => (
          <div className="flex flex-col gap-1">
            <FieldLabel required>Customer</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                aria-label="Customer"
                status={error ? "error" : undefined}
              >
                {customers.find((c) => c.id === field.value)?.name ??
                  "Select customer…"}
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <FieldError>{error.message}</FieldError>}
          </div>
        )}
      />

      <Controller
        control={control}
        name="vesselId"
        render={({ field, fieldState: { error } }) => (
          <div className="flex flex-col gap-1">
            <FieldLabel required>Vessel</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                aria-label="Vessel"
                status={error ? "error" : undefined}
              >
                {vessels.find((v) => v.id === field.value)?.name ??
                  "Select vessel…"}
              </SelectTrigger>
              <SelectContent>
                {vessels.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <FieldError>{error.message}</FieldError>}
          </div>
        )}
      />

      <TextInput
        label="Origin"
        required
        placeholder="e.g. Copenhagen"
        errorMessage={errors.origin?.message}
        status={errors.origin ? "error" : undefined}
        {...register("origin")}
      />
      <TextInput
        label="Destination"
        required
        placeholder="e.g. Oslo"
        errorMessage={errors.destination?.message}
        status={errors.destination ? "error" : undefined}
        {...register("destination")}
      />
      <TextInput
        label="Cargo Type"
        required
        placeholder="e.g. Electronics"
        errorMessage={errors.cargoType?.message}
        status={errors.cargoType ? "error" : undefined}
        {...register("cargoType")}
      />
      <TextInput
        label="Weight (kg)"
        required
        type="number"
        min={1}
        placeholder="e.g. 5000"
        errorMessage={errors.weightKg?.message}
        status={errors.weightKg ? "error" : undefined}
        {...register("weightKg", { valueAsNumber: true })}
      />

      {includeStatus && (
        <Controller
          control={control}
          name="status"
          render={({ field, fieldState: { error } }) => (
            <div className="flex flex-col gap-1">
              <FieldLabel required>Status</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  aria-label="Status"
                  status={error ? "error" : undefined}
                >
                  {STATUS_META[field.value].label}
                </SelectTrigger>
                <SelectContent>
                  {BOOKING_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error && <FieldError>{error.message}</FieldError>}
            </div>
          )}
        />
      )}

      <TextInput
        label="Departure Date"
        required
        type="datetime-local"
        errorMessage={errors.departureAt?.message}
        status={errors.departureAt ? "error" : undefined}
        {...register("departureAt")}
      />
      <div className={includeStatus ? "md:col-span-2 md:max-w-xs" : undefined}>
        <TextInput
          label="Arrival Date"
          required
          type="datetime-local"
          errorMessage={errors.arrivalAt?.message}
          status={errors.arrivalAt ? "error" : undefined}
          {...register("arrivalAt")}
        />
      </div>
    </div>
  );
}
