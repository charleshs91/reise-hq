import { sql } from "drizzle-orm";
import { check, index, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Known Places, seeded from OurAirports plus the curated overlay (ADR 0002). */
export const places = sqliteTable(
  "places",
  {
    /** The Skyscanner identifier itself: an IATA code or a verified city slug. */
    id: text("id").primaryKey(),
    kind: text("kind", { enum: ["airport", "citySlug"] }).notNull(),
    name: text("name").notNull(),
    city: text("city"),
    country: text("country").notNull(),
    type: text("type", { enum: ["large_airport", "medium_airport"] }),
    /** lower(strip_diacritics(name + ' ' + city + ' ' + id)); search runs here, display never. */
    searchText: text("search_text").notNull(),
  },
  (t) => [check("places_kind", sql`${t.kind} in ('airport', 'citySlug')`)],
);

/** Key/value facts about this database, e.g. which Place dataset it was seeded from. */
export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const trips = sqliteTable("trips", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const searches = sqliteTable(
  "searches",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id),
    originId: text("origin_id")
      .notNull()
      .references(() => places.id),
    destinationId: text("destination_id")
      .notNull()
      .references(() => places.id),
    departureDate: text("departure_date").notNull(),
    /** Null means one-way. There is no one-way flag. */
    returnDate: text("return_date"),
    currency: text("currency").notNull(),
  },
  (t) => [
    index("searches_trip").on(t.tripId),
    check(
      "searches_return_after_departure",
      sql`${t.returnDate} is null or ${t.returnDate} >= ${t.departureDate}`,
    ),
  ],
);

export const candidates = sqliteTable(
  "candidates",
  {
    id: text("id").primaryKey(),
    searchId: text("search_id")
      .notNull()
      .references(() => searches.id),
    label: text("label").notNull(),
    stops: text("stops", {
      enum: ["direct", "one-stop", "two-plus"],
    }).notNull(),
  },
  (t) => [
    index("candidates_search").on(t.searchId),
    check(
      "candidates_stops",
      sql`${t.stops} in ('direct', 'one-stop', 'two-plus')`,
    ),
  ],
);

export const priceObservations = sqliteTable(
  "price_observations",
  {
    id: text("id").primaryKey(),
    /** The one cascade in the schema: deleting a Candidate takes its history with it. */
    candidateId: text("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    amount: real("amount").notNull(),
    /** ISO timestamp. */
    observedAt: text("observed_at").notNull(),
    /** In the model; nothing in v1 writes it. */
    remark: text("remark"),
  },
  (t) => [
    index("price_observations_candidate").on(t.candidateId),
    check("price_observations_amount", sql`${t.amount} > 0`),
  ],
);
