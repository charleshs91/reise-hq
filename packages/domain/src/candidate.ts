export const STOPS = ["direct", "one-stop", "two-plus"] as const;
export type Stops = (typeof STOPS)[number];

/** A flight option under a Search, loosely identified by a free-text label. */
export type Candidate = {
  readonly id: string;
  readonly searchId: string;
  readonly label: string;
  readonly stops: Stops;
};

/** What a Candidate cost at a moment. Append-only; a mistake is corrected by logging another. */
export type PriceObservation = {
  readonly amount: number;
  /** ISO timestamp. */
  readonly observedAt: string;
};

export type PriceDelta = {
  readonly direction: "up" | "down" | "flat";
  readonly magnitude: number;
};

/** The latest price and its move against the immediately previous observation. */
export function latestPrice(
  observations: readonly PriceObservation[],
): { amount: number; delta: PriceDelta | null } | null {
  const [latest, previous] = [...observations].sort((a, b) =>
    b.observedAt.localeCompare(a.observedAt),
  );
  if (!latest) return null;
  if (!previous) return { amount: latest.amount, delta: null };

  const change = latest.amount - previous.amount;
  return {
    amount: latest.amount,
    delta: {
      direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
      magnitude: Math.abs(change),
    },
  };
}
