/* eslint-disable -- PROTOTYPE, throwaway: not held to repo lint standards. */
// PROTOTYPE — throwaway. Ticket 04 (core flow). Do not merge to main.
// In-memory only: no DB, no server actions. See .scratch/flight-candidate-tracker/issues/04-core-flow-prototype.md

export type Place = { id: string; name: string };
export type PriceObservation = {
  id: string;
  amount: number;
  observedAt: string; // ISO
  remark?: string;
};
export type Stops = "direct" | "one-stop" | "two-plus";
export type Candidate = {
  id: string;
  label: string;
  stops: Stops;
  observations: PriceObservation[];
};
export type Search = {
  id: string;
  origin: Place;
  destination: Place;
  departDate: string; // yyyy-mm-dd
  returnDate?: string;
  currency: string;
  candidates: Candidate[];
};
export type Trip = { id: string; name: string; searches: Search[] };

export const PLACES: Place[] = [
  { id: "taipei", name: "Taipei (TPE)" },
  { id: "tokyo", name: "Tokyo (any)" },
  { id: "osaka", name: "Osaka (KIX)" },
  { id: "london", name: "London (any)" },
  { id: "lisbon", name: "Lisbon (LIS)" },
];

/** Stub of the real seam. `yymmdd` per the deep-link research note. */
export function buildSkyscannerUrl(s: Search): string {
  const d = (iso: string) => iso.slice(2).replaceAll("-", "");
  const dates = [d(s.departDate), s.returnDate ? d(s.returnDate) : null]
    .filter(Boolean)
    .join("/");
  return `https://www.skyscanner.net/transport/flights/${s.origin.id}/${s.destination.id}/${dates}/?currency=${s.currency}&adults=1&cabinclass=economy`;
}

export const isRoundTrip = (s: Search) => Boolean(s.returnDate);
export const latest = (c: Candidate) => c.observations.at(-1);
export const cheapest = (c: Candidate) =>
  c.observations.reduce<PriceObservation | undefined>(
    (best, o) => (!best || o.amount < best.amount ? o : best),
    undefined,
  );
export function trend(c: Candidate): "up" | "down" | "flat" | null {
  const [a, b] = [c.observations.at(-2), c.observations.at(-1)];
  if (!a || !b) return null;
  return b.amount > a.amount ? "up" : b.amount < a.amount ? "down" : "flat";
}

export const money = (n: number, currency: string) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

export const when = (iso: string) => {
  const days = Math.round((Date.now() - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
};

const ago = (days: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString();

let n = 0;
export const uid = () => `p${++n}-${Math.random().toString(36).slice(2, 7)}`;

export const SEED: Trip[] = [
  {
    id: "t1",
    name: "Japan in March",
    searches: [
      {
        id: "s1",
        origin: PLACES[0],
        destination: PLACES[1],
        departDate: "2027-03-14",
        returnDate: "2027-03-22",
        currency: "TWD",
        candidates: [
          {
            id: "c1",
            label: "China Airlines direct 08:40",
            stops: "direct",
            observations: [
              { id: "o1", amount: 18400, observedAt: ago(12) },
              {
                id: "o2",
                amount: 17900,
                observedAt: ago(6),
                remark: "sale banner",
              },
              { id: "o3", amount: 19100, observedAt: ago(1) },
            ],
          },
          {
            id: "c2",
            label: "Peach via KIX 21:10",
            stops: "one-stop",
            observations: [
              { id: "o4", amount: 12300, observedAt: ago(6), remark: "no bag" },
              { id: "o5", amount: 12300, observedAt: ago(1) },
            ],
          },
          {
            id: "c3",
            label: "ANA direct 14:05",
            stops: "direct",
            observations: [{ id: "o6", amount: 22600, observedAt: ago(3) }],
          },
        ],
      },
      {
        id: "s2",
        origin: PLACES[0],
        destination: PLACES[2],
        departDate: "2027-03-14",
        returnDate: "2027-03-22",
        currency: "TWD",
        candidates: [
          {
            id: "c4",
            label: "Tigerair direct 07:20",
            stops: "direct",
            observations: [{ id: "o7", amount: 10800, observedAt: ago(2) }],
          },
        ],
      },
    ],
  },
  {
    id: "t2",
    name: "Europe, maybe autumn",
    searches: [
      {
        id: "s3",
        origin: PLACES[0],
        destination: PLACES[3],
        departDate: "2027-10-02",
        currency: "TWD",
        candidates: [],
      },
    ],
  },
];
