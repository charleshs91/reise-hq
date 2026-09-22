import type { Place } from "./place";

/**
 * A concrete query within a Trip. Round-trip when it has a return date, one-way
 * when it does not — derived, never stored as a flag. Dates are ISO `YYYY-MM-DD`.
 */
export type Search = {
  readonly origin: Place;
  readonly destination: Place;
  readonly departureDate: string;
  readonly returnDate: string | null;
  readonly currency: string;
};
