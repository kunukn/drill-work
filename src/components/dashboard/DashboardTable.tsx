import { Notification, Text } from "@dfds-ui/navaigator";
import type { BookingT } from "@/lib/api";

type DashboardTableProps = {
  title: string;
  subtitle: string;
  empty: string;
  rows: BookingT[];
  customerName: (id: string) => string;
  vesselName: (id: string) => string;
};

export function DashboardTable({
  title,
  subtitle,
  empty,
  rows,
  customerName,
  vesselName,
}: DashboardTableProps) {
  return (
    <section>
      <div className="mb-3">
        <Text variant="heading-md" asChild>
          <h2>{title}</h2>
        </Text>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      {rows.length === 0 ? (
        <Notification variant="info" title={empty} />
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow-sm border">
          <Table size="sm">
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vessel</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Arrival</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{customerName(b.customerId)}</TableCell>
                  <TableCell>{vesselName(b.vesselId)}</TableCell>
                  <TableCell>
                    {b.origin} → {b.destination}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell>{formatDateTime(b.departureAt)}</TableCell>
                  <TableCell>{formatDateTime(b.arrivalAt)}</TableCell>
                  <TableCell>
                    <Button asChild variant="link" size="sm">
                      <Link to="/bookings/$id" params={{ id: b.id }}>
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);

  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
