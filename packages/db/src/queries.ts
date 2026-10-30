import {
  appConfig,
  newId,
  nextDepartureDate,
  type Candidate,
  type Place,
  type PriceObservation,
  type Search,
  type Stops,
  type Trip,
} from "@reise-hq/domain";
import { asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "./client.ts";
import { foldText } from "./places/fold.ts";
import { MIN_QUERY_LENGTH, rankPlaces } from "./places/rank.ts";
import type { PlaceRow } from "./places/row.ts";
import {
  candidates,
  places,
  priceObservations,
  searches,
  trips,
} from "./schema.ts";

/** A `placeId` that is not in `places`: free text never becomes a Place. */
export class UnknownPlaceError extends Error {
  constructor(id: string) {
    super(`Unknown Place ${id}`);
    this.name = "UnknownPlaceError";
  }
}

// ── Trips ───────────────────────────────────────────────────────────────────

export type TripListRow = Trip & { readonly nextDepartureDate: string | null };

export function listTrips(db: Db, today: string): TripListRow[] {
  const allTrips = db.select().from(trips).orderBy(asc(trips.id)).all();
  const departures = db
    .select({ tripId: searches.tripId, departureDate: searches.departureDate })
    .from(searches)
    .all();

  return allTrips.map((trip) => ({
    id: trip.id,
    name: trip.name,
    nextDepartureDate: nextDepartureDate(
      departures.filter((d) => d.tripId === trip.id),
      today,
    ),
  }));
}

export function createTrip(db: Db, rawName: string): string {
  const name = rawName.trim();
  if (name === "") throw new Error("A Trip needs a name");
  const id = newId();
  db.insert(trips).values({ id, name }).run();
  return id;
}

// ── Trip page ───────────────────────────────────────────────────────────────

export type CandidateWithHistory = Candidate & {
  readonly observations: readonly PriceObservation[];
};

export type SearchWithCandidates = Search & {
  readonly id: string;
  readonly candidates: readonly CandidateWithHistory[];
};

export type TripPage = {
  readonly trip: Trip;
  readonly searches: readonly SearchWithCandidates[];
};

export function toPlace(row: Pick<PlaceRow, "id" | "kind" | "name">): Place {
  return row.kind === "airport"
    ? { id: row.id, kind: "airport", iata: row.id, name: row.name }
    : { id: row.id, kind: "citySlug", slug: row.id, name: row.name };
}

export function getTripPage(db: Db, tripId: string): TripPage | null {
  const trip = db.select().from(trips).where(eq(trips.id, tripId)).get();
  if (!trip) return null;

  const searchRows = db
    .select()
    .from(searches)
    .where(eq(searches.tripId, tripId))
    .orderBy(asc(searches.id))
    .all();
  const searchIds = searchRows.map((s) => s.id);
  const placeIds = [
    ...new Set(searchRows.flatMap((s) => [s.originId, s.destinationId])),
  ];

  const placeById = new Map(
    (placeIds.length
      ? db.select().from(places).where(inArray(places.id, placeIds)).all()
      : []
    ).map((p) => [p.id, toPlace(p)]),
  );
  const candidateRows = searchIds.length
    ? db
        .select()
        .from(candidates)
        .where(inArray(candidates.searchId, searchIds))
        .orderBy(asc(candidates.id))
        .all()
    : [];
  const candidateIds = candidateRows.map((c) => c.id);
  const observationRows = candidateIds.length
    ? db
        .select()
        .from(priceObservations)
        .where(inArray(priceObservations.candidateId, candidateIds))
        .orderBy(asc(priceObservations.observedAt), asc(priceObservations.id))
        .all()
    : [];

  const placeFor = (id: string): Place => {
    const place = placeById.get(id);
    if (!place) throw new UnknownPlaceError(id);
    return place;
  };

  return {
    trip: { id: trip.id, name: trip.name },
    searches: searchRows.map((s) => ({
      id: s.id,
      origin: placeFor(s.originId),
      destination: placeFor(s.destinationId),
      departureDate: s.departureDate,
      returnDate: s.returnDate,
      currency: s.currency,
      candidates: candidateRows
        .filter((c) => c.searchId === s.id)
        .map((c) => ({
          id: c.id,
          searchId: c.searchId,
          label: c.label,
          stops: c.stops,
          observations: observationRows
            .filter((o) => o.candidateId === c.id)
            .map((o) => ({
              amount: o.amount,
              observedAt: o.observedAt,
              remark: o.remark,
            })),
        })),
    })),
  };
}

// ── Searches ────────────────────────────────────────────────────────────────

export type NewSearch = {
  readonly tripId: string;
  readonly originId: string;
  readonly destinationId: string;
  readonly departureDate: string;
  readonly returnDate: string | null;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function createSearch(db: Db, input: NewSearch): string {
  for (const placeId of [input.originId, input.destinationId]) {
    if (!placeExists(db, placeId)) {
      throw new UnknownPlaceError(placeId);
    }
  }
  if (!isIsoDate(input.departureDate))
    throw new Error("A departure date is required");
  if (input.returnDate !== null) {
    if (!isIsoDate(input.returnDate))
      throw new Error("Unparseable return date");
    if (input.returnDate < input.departureDate) {
      throw new Error("The return date cannot be before the departure date");
    }
  }

  const id = newId();
  db.insert(searches)
    .values({ id, ...input, currency: appConfig.currency })
    .run();
  return id;
}

// ── Candidates and prices ───────────────────────────────────────────────────

function assertAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("A price amount must be a positive number");
  }
}

export type NewCandidate = {
  readonly searchId: string;
  readonly label: string;
  readonly stops: Stops;
  readonly amount: number;
  readonly observedAt: string;
};

/** A Candidate cannot exist without a first price, so both are written as one act. */
export function createCandidate(db: Db, input: NewCandidate): string {
  const label = input.label.trim();
  if (label === "") throw new Error("A Candidate needs a label");
  assertAmount(input.amount);
  if (
    !db
      .select({ id: searches.id })
      .from(searches)
      .where(eq(searches.id, input.searchId))
      .get()
  ) {
    throw new Error("That Search no longer exists");
  }

  const id = newId();
  db.transaction((tx) => {
    tx.insert(candidates)
      .values({ id, searchId: input.searchId, label, stops: input.stops })
      .run();
    tx.insert(priceObservations)
      .values({
        id: newId(),
        candidateId: id,
        amount: input.amount,
        observedAt: input.observedAt,
      })
      .run();
  });
  return id;
}

export function logPrice(
  db: Db,
  input: {
    readonly candidateId: string;
    readonly amount: number;
    readonly observedAt: string;
  },
): void {
  assertAmount(input.amount);
  if (
    !db
      .select({ id: candidates.id })
      .from(candidates)
      .where(eq(candidates.id, input.candidateId))
      .get()
  ) {
    throw new Error("That Candidate no longer exists");
  }
  db.insert(priceObservations)
    .values({ id: newId(), ...input })
    .run();
}

export function setStops(db: Db, candidateId: string, stops: Stops): void {
  db.update(candidates)
    .set({ stops })
    .where(eq(candidates.id, candidateId))
    .run();
}

/** The one act that destroys price history; the schema cascades to observations. */
export function deleteCandidate(db: Db, candidateId: string): void {
  const { changes } = db
    .delete(candidates)
    .where(eq(candidates.id, candidateId))
    .run();
  if (changes === 0) throw new Error("That Candidate no longer exists");
}

// ── Place search ────────────────────────────────────────────────────────────

export type PlaceSearchResult = {
  readonly places: PlaceRow[];
  readonly total: number;
};

/** One LIKE over the folded search text, ranked in TypeScript, capped. */
export function searchPlaces(
  db: Db,
  rawQuery: string,
  limit = 10,
): PlaceSearchResult {
  const query = foldText(rawQuery.trim());
  if (query.length < MIN_QUERY_LENGTH) return { places: [], total: 0 };

  const escaped = query.replace(/[\\%_]/g, (ch) => `\\${ch}`);
  const rows = db
    .select({
      id: places.id,
      kind: places.kind,
      name: places.name,
      city: places.city,
      country: places.country,
      type: places.type,
    })
    .from(places)
    .where(sql`${places.searchText} like ${`%${escaped}%`} escape '\\'`)
    .all();

  const ranked = rankPlaces(query, rows);
  // Spread into plain objects: rows may carry a null prototype React will not serialise.
  return {
    places: ranked.slice(0, limit).map((p) => ({ ...p })),
    total: ranked.length,
  };
}

export function placeExists(db: Db, id: string): boolean {
  return (
    db.select({ id: places.id }).from(places).where(eq(places.id, id)).get() !==
    undefined
  );
}
