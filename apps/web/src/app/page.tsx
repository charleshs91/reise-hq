import { listTrips } from "@reise-hq/db";
import Link from "next/link";
import { connection } from "next/server";
import { NewTripForm } from "@/components/NewTripForm";
import { formatDate, todayIso } from "@/lib/dates";
import { db } from "@/lib/db";

export default async function TripList() {
  await connection();
  const trips = listTrips(db(), todayIso());

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Trips</h1>
      <NewTripForm />
      {trips.length === 0 ? (
        <p className="text-muted">No trips yet.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link
                href={`/trips/${trip.id}`}
                className="flex items-baseline justify-between gap-4 px-4 py-3 hover:bg-accent-wash"
              >
                <span className="font-medium">{trip.name}</span>
                <span className="text-sm text-muted">
                  {trip.nextDepartureDate
                    ? formatDate(trip.nextDepartureDate)
                    : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
