/**
 * Placeholder domain model. Exists only to prove the workspace boundary:
 * `apps/web` imports this package, typechecks it, and renders its output.
 * Replace with the real travel domain when features start.
 */
export type Trip = {
  readonly id: string;
  readonly destination: string;
  readonly startDate: string;
  readonly endDate: string;
};

/** Inclusive length of a trip in days. */
export function tripDurationInDays(trip: Trip): number {
  const start = Date.parse(trip.startDate);
  const end = Date.parse(trip.endDate);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new Error(`Trip ${trip.id} has an unparseable date range`);
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end - start) / msPerDay) + 1;
}
