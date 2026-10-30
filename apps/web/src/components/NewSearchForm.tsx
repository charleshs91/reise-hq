"use client";

import type { PlaceRow } from "@reise-hq/db";
import { useState, useTransition } from "react";
import { createSearchAction } from "@/app/actions";
import type { Range } from "@/lib/calendar";
import { DateRange } from "./DateRange";
import { PlaceInput } from "./PlaceInput";

const EMPTY_RANGE: Range = { departure: "", return: "" };

/** Origin, destination, dates — the entire form. There is no one-way flag to set. */
export function NewSearchForm({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState<PlaceRow | null>(null);
  const [destination, setDestination] = useState<PlaceRow | null>(null);
  const [range, setRange] = useState<Range>(EMPTY_RANGE);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSubmit =
    origin !== null &&
    destination !== null &&
    range.departure !== "" &&
    !pending;

  const close = () => {
    setOrigin(null);
    setDestination(null);
    setRange(EMPTY_RANGE);
    setError(null);
    setOpen(false);
  };

  const save = (returnDate: string) => {
    if (!origin || !destination || !range.departure) return;
    startTransition(async () => {
      const result = await createSearchAction({
        tripId,
        originId: origin.id,
        destinationId: destination.id,
        departureDate: range.departure,
        returnDate: returnDate === "" ? null : returnDate,
      });
      if (result) setError(result.error);
      else close();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="text-sm text-muted underline hover:text-accent"
      >
        + Add a search
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(range.return);
      }}
      className="space-y-4 rounded-2xl border border-line bg-card p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <PlaceInput
          label="Leaving from"
          name="originId"
          value={origin}
          onChange={setOrigin}
        />
        <PlaceInput
          label="Going to"
          name="destinationId"
          value={destination}
          onChange={setDestination}
        />
      </div>
      <DateRange
        range={range}
        onChange={setRange}
        onSaveOneWay={() => {
          save("");
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" disabled={!canSubmit}>
          {range.return ? "Save round trip" : "Save as one-way"}
        </button>
        <button
          type="button"
          onClick={close}
          className="text-sm text-muted underline"
        >
          Cancel
        </button>
        {error && <p className="text-sm text-accent">{error}</p>}
      </div>
    </form>
  );
}
