import { z } from "zod";

/*
 * Client-side validation schema for the booking create/edit forms,
 * consumed via `zodResolver` in `react-hook-form`.
 *
 * Lives in `src/lib/` (not `src/server/api/`) because client code must not
 * import from server modules — those pull in `drizzle-orm` and would leak
 * server-only deps into the browser bundle. This is a plain-Zod mirror of
 * the fields the form actually edits.
 */
export const BookingFormSchema = z.object({
  customerId: z.string().min(1, "Required"),
  vesselId: z.string().min(1, "Required"),
  origin: z.string().min(1, "Required"),
  destination: z.string().min(1, "Required"),
  cargoType: z.string().min(1, "Required"),
  weightKg: z.number().int().positive("Must be a positive number"),
  status: z.enum([
    "pending",
    "confirmed",
    "in_transit",
    "delivered",
    "cancelled",
  ]),
  departureAt: z.string().min(1, "Required"),
  arrivalAt: z.string().min(1, "Required"),
});

export type BookingFormValues = z.infer<typeof BookingFormSchema>;
