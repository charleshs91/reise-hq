/** A name-only folder of Searches. Its dates are read off its Searches, never stored. */
export type Trip = {
  readonly id: string;
  readonly name: string;
};

/**
 * The earliest departure across a Trip's Searches that is not in the past, or
 * null. Dates are ISO `YYYY-MM-DD`, so they compare as strings.
 */
export function nextDepartureDate(
  searches: readonly { readonly departureDate: string }[],
  today: string,
): string | null {
  let next: string | null = null;
  for (const { departureDate } of searches) {
    if (departureDate >= today && (next === null || departureDate < next)) {
      next = departureDate;
    }
  }
  return next;
}
