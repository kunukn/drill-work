import { db } from "./index";
import { bookings, customers, sailings, terminals, vessels } from "./schema";

const SEED_CUSTOMERS = [
  { id: "cus_01", name: "DSV", email: "bookings@dsv.example", country: "DK" },
  {
    id: "cus_02",
    name: "Kuehne+Nagel",
    email: "freight@kn.example",
    country: "DE",
  },
  { id: "cus_03", name: "Geodis", email: "ops@geodis.example", country: "FR" },
  {
    id: "cus_04",
    name: "IKEA Supply",
    email: "supply@ikea.example",
    country: "SE",
  },
  {
    id: "cus_05",
    name: "LEGO Logistics",
    email: "logistics@lego.example",
    country: "DK",
  },
  {
    id: "cus_06",
    name: "Arla Foods",
    email: "shipping@arla.example",
    country: "DK",
  },
  {
    id: "cus_07",
    name: "Carlsberg",
    email: "export@carlsberg.example",
    country: "DK",
  },
  {
    id: "cus_08",
    name: "Amazon EU",
    email: "freight@amazon.example",
    country: "LU",
  },
];

const SEED_VESSELS = [
  { id: "ves_01", name: "Britannia Seaways", capacityTeu: 850 },
  { id: "ves_02", name: "Dover Seaways", capacityTeu: 920 },
  { id: "ves_03", name: "Côte des Dunes", capacityTeu: 1100 },
  { id: "ves_04", name: "Botnia Seaways", capacityTeu: 760 },
  { id: "ves_05", name: "Ficaria Seaways", capacityTeu: 1240 },
];

const SEED_TERMINALS = [
  { id: "trm_cph", name: "Copenhagen", country: "DK", unlocode: "DKCPH" },
  { id: "trm_brv", name: "Brevik", country: "NO", unlocode: "NOBVK" },
  { id: "trm_got", name: "Göteborg", country: "SE", unlocode: "SEGOT" },
  { id: "trm_kel", name: "Kiel", country: "DE", unlocode: "DEKEL" },
  { id: "trm_dvr", name: "Dover", country: "GB", unlocode: "GBDVR" },
  { id: "trm_cqf", name: "Calais", country: "FR", unlocode: "FRCQF" },
  { id: "trm_dkk", name: "Dunkirk", country: "FR", unlocode: "FRDKK" },
  { id: "trm_fdh", name: "Frederikshavn", country: "DK", unlocode: "DKFDH" },
  {
    id: "trm_imm",
    name: "Immingham Riverside",
    country: "GB",
    unlocode: "GBIMM",
  },
  {
    id: "trm_ams",
    name: "Amsterdam (Ijmuiden)",
    country: "NL",
    unlocode: "NLIJM",
  },
  { id: "trm_klj", name: "Klaipeda", country: "LT", unlocode: "LTKLJ" },
  { id: "trm_kah", name: "Karlshamn", country: "SE", unlocode: "SEKAN" },
  { id: "trm_pdi", name: "Paldiski", country: "EE", unlocode: "EEPDS" },
  { id: "trm_kpl", name: "Kapellskär", country: "SE", unlocode: "SEKAP" },
  { id: "trm_muu", name: "Muuga", country: "EE", unlocode: "EEMUG" },
  { id: "trm_vuo", name: "Vuosaari", country: "FI", unlocode: "FIVUO" },
  { id: "trm_han", name: "Hanko", country: "FI", unlocode: "FIHKO" },
  { id: "trm_cux", name: "Cuxhaven", country: "DE", unlocode: "DECUX" },
  { id: "trm_esb", name: "Esbjerg", country: "DK", unlocode: "DKEBJ" },
  { id: "trm_fda", name: "Fredericia", country: "DK", unlocode: "DKFRC" },
  { id: "trm_frd", name: "Fredrikstad", country: "NO", unlocode: "NOFRK" },
  { id: "trm_new", name: "Newcastle", country: "GB", unlocode: "GBNCL" },
  { id: "trm_fxt", name: "Felixstowe", country: "GB", unlocode: "GBFXT" },
  { id: "trm_rtm", name: "Rotterdam", country: "NL", unlocode: "NLRTM" },
  { id: "trm_gnt", name: "Gent", country: "BE", unlocode: "BEGNE" },
  { id: "trm_alg", name: "Algeciras", country: "ES", unlocode: "ESALG" },
  { id: "trm_tng", name: "Tanger Med", country: "MA", unlocode: "MAPTM" },
];

type SailingStatus =
  | "scheduled"
  | "boarding"
  | "departed"
  | "arrived"
  | "cancelled";
type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_transit"
  | "delivered"
  | "cancelled";

type BookingSpec = {
  customerId: string;
  origin: string;
  destination: string;
  cargoType: string;
  weightKg: number;
  status: BookingStatus;
};

type SailingSpec = {
  id: string;
  vesselId: string;
  vesselTotalKg: number;
  fromTerminalId: string;
  toTerminalId: string;
  departureOffsetHours: number;
  durationHours: number;
  status: SailingStatus;
  bookings: BookingSpec[];
};

// Sailings are anchored to seed time so the demo never goes stale.
// Each sailing's bookings share the same vesselId + departureAt, which is
// how the dashboard joins booked weight to capacity.
const SAILING_PLAN: SailingSpec[] = [
  // 1. Boarding right now — populated, on the ticker.
  {
    id: "sai_01",
    vesselId: "ves_02",
    vesselTotalKg: 700_000,
    fromTerminalId: "trm_got",
    toTerminalId: "trm_kel",
    departureOffsetHours: 0.5,
    durationHours: 14,
    status: "boarding",
    bookings: [
      {
        customerId: "cus_02",
        origin: "Göteborg",
        destination: "Kiel",
        cargoType: "automotive",
        weightKg: 220_000,
        status: "confirmed",
      },
      {
        customerId: "cus_05",
        origin: "Göteborg",
        destination: "Kiel",
        cargoType: "general",
        weightKg: 180_000,
        status: "confirmed",
      },
      {
        customerId: "cus_01",
        origin: "Göteborg",
        destination: "Kiel",
        cargoType: "general",
        weightKg: 125_000,
        status: "confirmed",
      },
    ],
  },
  // 2. Today, hot — red band, boarding now to populate the ticker rotation.
  {
    id: "sai_02",
    vesselId: "ves_03",
    vesselTotalKg: 900_000,
    fromTerminalId: "trm_dvr",
    toTerminalId: "trm_cqf",
    departureOffsetHours: 1.5,
    durationHours: 2.5,
    status: "boarding",
    bookings: [
      {
        customerId: "cus_03",
        origin: "Dover",
        destination: "Calais",
        cargoType: "automotive",
        weightKg: 350_000,
        status: "confirmed",
      },
      {
        customerId: "cus_06",
        origin: "Dover",
        destination: "Calais",
        cargoType: "refrigerated",
        weightKg: 280_000,
        status: "confirmed",
      },
      {
        customerId: "cus_08",
        origin: "Dover",
        destination: "Calais",
        cargoType: "general",
        weightKg: 215_000,
        status: "confirmed",
      },
    ],
  },
  // 3. Tomorrow, healthy green — pending booking surfaces in "needs attention".
  {
    id: "sai_03",
    vesselId: "ves_01",
    vesselTotalKg: 600_000,
    fromTerminalId: "trm_cph",
    toTerminalId: "trm_brv",
    departureOffsetHours: 24,
    durationHours: 14,
    status: "scheduled",
    bookings: [
      {
        customerId: "cus_01",
        origin: "Copenhagen",
        destination: "Brevik",
        cargoType: "general",
        weightKg: 140_000,
        status: "pending",
      },
      {
        customerId: "cus_07",
        origin: "Copenhagen",
        destination: "Brevik",
        cargoType: "general",
        weightKg: 100_000,
        status: "confirmed",
      },
    ],
  },
  // 4. Tomorrow afternoon, mid load.
  {
    id: "sai_04",
    vesselId: "ves_05",
    vesselTotalKg: 1_000_000,
    fromTerminalId: "trm_got",
    toTerminalId: "trm_imm",
    departureOffsetHours: 32,
    durationHours: 26,
    status: "scheduled",
    bookings: [
      {
        customerId: "cus_04",
        origin: "Göteborg",
        destination: "Immingham Riverside",
        cargoType: "automotive",
        weightKg: 250_000,
        status: "confirmed",
      },
      {
        customerId: "cus_02",
        origin: "Göteborg",
        destination: "Immingham Riverside",
        cargoType: "general",
        weightKg: 200_000,
        status: "pending",
      },
      {
        customerId: "cus_08",
        origin: "Göteborg",
        destination: "Immingham Riverside",
        cargoType: "general",
        weightKg: 150_000,
        status: "confirmed",
      },
    ],
  },
  // 5. Day 2, amber.
  {
    id: "sai_05",
    vesselId: "ves_04",
    vesselTotalKg: 550_000,
    fromTerminalId: "trm_cux",
    toTerminalId: "trm_klj",
    departureOffsetHours: 48,
    durationHours: 16,
    status: "scheduled",
    bookings: [
      {
        customerId: "cus_06",
        origin: "Cuxhaven",
        destination: "Klaipeda",
        cargoType: "general",
        weightKg: 240_000,
        status: "confirmed",
      },
      {
        customerId: "cus_03",
        origin: "Cuxhaven",
        destination: "Klaipeda",
        cargoType: "refrigerated",
        weightKg: 200_000,
        status: "pending",
      },
    ],
  },
  // 6. Day 2 afternoon, amber-high.
  {
    id: "sai_06",
    vesselId: "ves_03",
    vesselTotalKg: 900_000,
    fromTerminalId: "trm_cqf",
    toTerminalId: "trm_dvr",
    departureOffsetHours: 52,
    durationHours: 2.5,
    status: "scheduled",
    bookings: [
      {
        customerId: "cus_03",
        origin: "Calais",
        destination: "Dover",
        cargoType: "automotive",
        weightKg: 320_000,
        status: "confirmed",
      },
      {
        customerId: "cus_05",
        origin: "Calais",
        destination: "Dover",
        cargoType: "general",
        weightKg: 280_000,
        status: "pending",
      },
      {
        customerId: "cus_07",
        origin: "Calais",
        destination: "Dover",
        cargoType: "general",
        weightKg: 190_000,
        status: "confirmed",
      },
    ],
  },
  // 7. Day 3, mid.
  {
    id: "sai_07",
    vesselId: "ves_02",
    vesselTotalKg: 700_000,
    fromTerminalId: "trm_kel",
    toTerminalId: "trm_got",
    departureOffsetHours: 66,
    durationHours: 14,
    status: "scheduled",
    bookings: [
      {
        customerId: "cus_05",
        origin: "Kiel",
        destination: "Göteborg",
        cargoType: "general",
        weightKg: 200_000,
        status: "pending",
      },
      {
        customerId: "cus_02",
        origin: "Kiel",
        destination: "Göteborg",
        cargoType: "automotive",
        weightKg: 150_000,
        status: "confirmed",
      },
    ],
  },
  // 8. Day 3, light.
  {
    id: "sai_08",
    vesselId: "ves_01",
    vesselTotalKg: 600_000,
    fromTerminalId: "trm_brv",
    toTerminalId: "trm_cph",
    departureOffsetHours: 72,
    durationHours: 14,
    status: "scheduled",
    bookings: [
      {
        customerId: "cus_06",
        origin: "Brevik",
        destination: "Copenhagen",
        cargoType: "refrigerated",
        weightKg: 180_000,
        status: "confirmed",
      },
    ],
  },
  // 9. Day 3 evening, mid.
  {
    id: "sai_09",
    vesselId: "ves_05",
    vesselTotalKg: 1_000_000,
    fromTerminalId: "trm_alg",
    toTerminalId: "trm_tng",
    departureOffsetHours: 78,
    durationHours: 2.5,
    status: "scheduled",
    bookings: [
      {
        customerId: "cus_04",
        origin: "Algeciras",
        destination: "Tanger Med",
        cargoType: "automotive",
        weightKg: 380_000,
        status: "confirmed",
      },
      {
        customerId: "cus_08",
        origin: "Algeciras",
        destination: "Tanger Med",
        cargoType: "general",
        weightKg: 170_000,
        status: "pending",
      },
    ],
  },
  // 10. Day 4, amber.
  {
    id: "sai_10",
    vesselId: "ves_04",
    vesselTotalKg: 550_000,
    fromTerminalId: "trm_fxt",
    toTerminalId: "trm_rtm",
    departureOffsetHours: 96,
    durationHours: 12,
    status: "scheduled",
    bookings: [
      {
        customerId: "cus_03",
        origin: "Felixstowe",
        destination: "Rotterdam",
        cargoType: "automotive",
        weightKg: 250_000,
        status: "pending",
      },
      {
        customerId: "cus_06",
        origin: "Felixstowe",
        destination: "Rotterdam",
        cargoType: "refrigerated",
        weightKg: 146_000,
        status: "confirmed",
      },
    ],
  },
  // 11. Day 4, light — second Dover→Calais sailing, top-lane reinforcement.
  {
    id: "sai_11",
    vesselId: "ves_03",
    vesselTotalKg: 900_000,
    fromTerminalId: "trm_dvr",
    toTerminalId: "trm_cqf",
    departureOffsetHours: 108,
    durationHours: 2.5,
    status: "scheduled",
    bookings: [
      {
        customerId: "cus_03",
        origin: "Dover",
        destination: "Calais",
        cargoType: "general",
        weightKg: 225_000,
        status: "confirmed",
      },
    ],
  },
  // 12. Day 5, mid — second Göteborg→Kiel.
  {
    id: "sai_12",
    vesselId: "ves_02",
    vesselTotalKg: 700_000,
    fromTerminalId: "trm_got",
    toTerminalId: "trm_kel",
    departureOffsetHours: 120,
    durationHours: 14,
    status: "scheduled",
    bookings: [
      {
        customerId: "cus_02",
        origin: "Göteborg",
        destination: "Kiel",
        cargoType: "automotive",
        weightKg: 250_000,
        status: "confirmed",
      },
      {
        customerId: "cus_05",
        origin: "Göteborg",
        destination: "Kiel",
        cargoType: "general",
        weightKg: 205_000,
        status: "pending",
      },
    ],
  },
  // 13. Yesterday — departed, in-transit cargo, past arrival → "needs attention".
  {
    id: "sai_13",
    vesselId: "ves_01",
    vesselTotalKg: 600_000,
    fromTerminalId: "trm_cph",
    toTerminalId: "trm_brv",
    departureOffsetHours: -24,
    durationHours: 14,
    status: "departed",
    bookings: [
      {
        customerId: "cus_01",
        origin: "Copenhagen",
        destination: "Brevik",
        cargoType: "automotive",
        weightKg: 280_000,
        status: "in_transit",
      },
      {
        customerId: "cus_07",
        origin: "Copenhagen",
        destination: "Brevik",
        cargoType: "general",
        weightKg: 230_000,
        status: "in_transit",
      },
    ],
  },
  // 14. Two days ago — arrived.
  {
    id: "sai_14",
    vesselId: "ves_03",
    vesselTotalKg: 900_000,
    fromTerminalId: "trm_pdi",
    toTerminalId: "trm_kpl",
    departureOffsetHours: -48,
    durationHours: 12,
    status: "arrived",
    bookings: [
      {
        customerId: "cus_08",
        origin: "Paldiski",
        destination: "Kapellskär",
        cargoType: "general",
        weightKg: 320_000,
        status: "delivered",
      },
      {
        customerId: "cus_04",
        origin: "Paldiski",
        destination: "Kapellskär",
        cargoType: "automotive",
        weightKg: 480_000,
        status: "delivered",
      },
    ],
  },
  // 15. Cancelled sailing.
  {
    id: "sai_15",
    vesselId: "ves_04",
    vesselTotalKg: 550_000,
    fromTerminalId: "trm_klj",
    toTerminalId: "trm_kah",
    departureOffsetHours: -72,
    durationHours: 10,
    status: "cancelled",
    bookings: [
      {
        customerId: "cus_07",
        origin: "Klaipeda",
        destination: "Karlshamn",
        cargoType: "refrigerated",
        weightKg: 89_000,
        status: "cancelled",
      },
    ],
  },
];

// Historical bookings — populate "delivered" counts and lane history,
// independent of any active sailing.
type PastBooking = BookingSpec & {
  vesselId: string;
  departureOffsetHours: number;
  arrivalOffsetHours: number;
};

const PAST_BOOKINGS: PastBooking[] = [
  {
    customerId: "cus_01",
    vesselId: "ves_01",
    origin: "Copenhagen",
    destination: "Brevik",
    cargoType: "general",
    weightKg: 18_500,
    status: "delivered",
    departureOffsetHours: -240,
    arrivalOffsetHours: -226,
  },
  {
    customerId: "cus_02",
    vesselId: "ves_02",
    origin: "Göteborg",
    destination: "Kiel",
    cargoType: "automotive",
    weightKg: 24_800,
    status: "delivered",
    departureOffsetHours: -192,
    arrivalOffsetHours: -178,
  },
  {
    customerId: "cus_05",
    vesselId: "ves_03",
    origin: "Dover",
    destination: "Calais",
    cargoType: "refrigerated",
    weightKg: 16_000,
    status: "delivered",
    departureOffsetHours: -144,
    arrivalOffsetHours: -141,
  },
  {
    customerId: "cus_06",
    vesselId: "ves_05",
    origin: "Göteborg",
    destination: "Immingham Riverside",
    cargoType: "general",
    weightKg: 14_200,
    status: "delivered",
    departureOffsetHours: -600,
    arrivalOffsetHours: -570,
  },
  {
    customerId: "cus_01",
    vesselId: "ves_02",
    origin: "Esbjerg",
    destination: "Immingham Riverside",
    cargoType: "refrigerated",
    weightKg: 15_900,
    status: "delivered",
    departureOffsetHours: -480,
    arrivalOffsetHours: -462,
  },
];

function buildSeedRows(now: Date) {
  const isoAt = (hours: number) =>
    new Date(now.getTime() + hours * 3_600_000).toISOString();

  const sailingRows = [];
  const bookingRows = [];
  let bkgCounter = 1;
  const nextBookingId = () => `bkg_${String(bkgCounter++).padStart(2, "0")}`;

  for (const s of SAILING_PLAN) {
    const dep = isoAt(s.departureOffsetHours);
    const arr = isoAt(s.departureOffsetHours + s.durationHours);
    const booked = s.bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + b.weightKg, 0);
    const remaining =
      s.status === "cancelled" ? 0 : Math.max(s.vesselTotalKg - booked, 0);

    sailingRows.push({
      id: s.id,
      vesselId: s.vesselId,
      fromTerminalId: s.fromTerminalId,
      toTerminalId: s.toTerminalId,
      departureAt: dep,
      arrivalAt: arr,
      capacityKgRemaining: remaining,
      status: s.status,
    });

    for (const b of s.bookings) {
      bookingRows.push({
        id: nextBookingId(),
        customerId: b.customerId,
        vesselId: s.vesselId,
        origin: b.origin,
        destination: b.destination,
        cargoType: b.cargoType,
        weightKg: b.weightKg,
        status: b.status,
        departureAt: dep,
        arrivalAt: arr,
      });
    }
  }

  for (const p of PAST_BOOKINGS) {
    bookingRows.push({
      id: nextBookingId(),
      customerId: p.customerId,
      vesselId: p.vesselId,
      origin: p.origin,
      destination: p.destination,
      cargoType: p.cargoType,
      weightKg: p.weightKg,
      status: p.status,
      departureAt: isoAt(p.departureOffsetHours),
      arrivalAt: isoAt(p.arrivalOffsetHours),
    });
  }

  return { sailingRows, bookingRows };
}

export async function seed() {
  const existing = await db.select().from(bookings);
  if (existing.length > 0) return;

  const { sailingRows, bookingRows } = buildSeedRows(new Date());

  for (const c of SEED_CUSTOMERS) await db.insert(customers).values(c);
  for (const v of SEED_VESSELS) await db.insert(vessels).values(v);
  for (const t of SEED_TERMINALS) await db.insert(terminals).values(t);
  for (const s of sailingRows) await db.insert(sailings).values(s);
  for (const b of bookingRows) await db.insert(bookings).values(b);
}
