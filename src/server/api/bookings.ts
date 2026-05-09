import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { bookings } from "@/server/db/schema";
import { registry } from "@/server/openapi";

export const BookingStatus = z
  .enum(["pending", "confirmed", "in_transit", "delivered", "cancelled"])
  .openapi("BookingStatus");

export const Booking = z
  .object({
    id: z.string(),
    customerId: z.string(),
    vesselId: z.string(),
    origin: z.string(),
    destination: z.string(),
    cargoType: z.string(),
    weightKg: z.number().int().positive(),
    status: BookingStatus,
    departureAt: z.string(),
    arrivalAt: z.string(),
    createdAt: z.string(),
  })
  .openapi("Booking");

export const NewBookingInput = z
  .object({
    customerId: z.string().min(1),
    vesselId: z.string().min(1),
    origin: z.string().min(1),
    destination: z.string().min(1),
    cargoType: z.string().min(1),
    weightKg: z.number().int().positive(),
    status: BookingStatus.default("pending"),
    departureAt: z.string(),
    arrivalAt: z.string(),
  })
  .openapi("NewBookingInput");

export const BookingPatch = NewBookingInput.partial().openapi("BookingPatch");

const ListQuery = z.object({
  status: BookingStatus.optional(),
  customerId: z.string().optional(),
  vesselId: z.string().optional(),
  departureAt: z.string().optional(),
});

const ErrorResponse = z.object({ error: z.string() }).openapi("Error");

registry.register("Booking", Booking);
registry.register("NewBookingInput", NewBookingInput);
registry.register("BookingPatch", BookingPatch);

registry.registerPath({
  method: "get",
  path: "/api/bookings",
  tags: ["Bookings"],
  summary: "List bookings",
  request: { query: ListQuery },
  responses: {
    200: {
      description: "All bookings, optionally filtered.",
      content: { "application/json": { schema: z.array(Booking) } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/bookings/{id}",
  tags: ["Bookings"],
  summary: "Get a booking by id",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: "The booking.",
      content: { "application/json": { schema: Booking } },
    },
    404: {
      description: "Not found.",
      content: { "application/json": { schema: ErrorResponse } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/bookings",
  tags: ["Bookings"],
  summary: "Create a booking",
  request: {
    body: {
      content: { "application/json": { schema: NewBookingInput } },
    },
  },
  responses: {
    201: {
      description: "Created.",
      content: { "application/json": { schema: Booking } },
    },
    400: {
      description: "Validation error.",
      content: { "application/json": { schema: ErrorResponse } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/bookings/{id}",
  tags: ["Bookings"],
  summary: "Update a booking",
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: BookingPatch } } },
  },
  responses: {
    200: {
      description: "Updated.",
      content: { "application/json": { schema: Booking } },
    },
    400: {
      description: "Validation error.",
      content: { "application/json": { schema: ErrorResponse } },
    },
    404: {
      description: "Not found.",
      content: { "application/json": { schema: ErrorResponse } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/bookings/{id}",
  tags: ["Bookings"],
  summary: "Delete a booking",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    204: { description: "Deleted." },
    404: {
      description: "Not found.",
      content: { "application/json": { schema: ErrorResponse } },
    },
  },
});

export async function listBookings(url: URL) {
  const q = ListQuery.parse(Object.fromEntries(url.searchParams));
  const filters = [];
  if (q.status) filters.push(eq(bookings.status, q.status));
  if (q.customerId) filters.push(eq(bookings.customerId, q.customerId));
  if (q.vesselId) filters.push(eq(bookings.vesselId, q.vesselId));
  if (q.departureAt) filters.push(eq(bookings.departureAt, q.departureAt));
  const rows =
    filters.length > 0
      ? await db
          .select()
          .from(bookings)
          .where(filters.length === 1 ? filters[0] : and(...filters))
      : await db.select().from(bookings);
  return z.array(Booking).parse(rows);
}

export async function getBooking(id: string) {
  const [row] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!row) return null;

  return Booking.parse(row);
}

/* Demo-grade id: short, sortable-ish, collision-tolerable for a single
   seeded SQLite file. Not cryptographically random — don't reuse this
   pattern for anything user-facing or security-sensitive. */
function generateId() {
  return `bkg_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createBooking(body: unknown) {
  const input = NewBookingInput.parse(body);
  const id = generateId();
  await db.insert(bookings).values({ id, ...input });
  const created = await getBooking(id);
  if (!created) throw new Error("Booking vanished after insert");
  return created;
}

export async function updateBooking(id: string, body: unknown) {
  const patch = BookingPatch.parse(body);
  if (Object.keys(patch).length === 0) return getBooking(id);

  const result = await db
    .update(bookings)
    .set(patch)
    .where(eq(bookings.id, id));
  /* sqlite-proxy doesn't surface affected-row counts, so we can't tell
     from `result` whether the row existed. `void result` silences the
     unused-var lint; the follow-up `getBooking(id)` is what actually
     confirms the row and returns it as the response payload. */
  void result;
  return getBooking(id);
}

export async function deleteBooking(id: string) {
  const existing = await getBooking(id);
  if (!existing) return false;

  await db.delete(bookings).where(eq(bookings.id, id));
  return true;
}
