"use client";

import type { Stops } from "@reise-hq/domain";
import { useRef, useState, useTransition } from "react";
import { createCandidateAction } from "@/app/actions";
import { parseAmount } from "@/lib/money";
import { StopsChips } from "./StopsChips";

/** Label, stops and a first price, created as one act: no Candidate exists without a price. */
export function NewCandidateRow({
  tripId,
  searchId,
}: {
  tripId: string;
  searchId: string;
}) {
  const [label, setLabel] = useState("");
  const [stops, setStops] = useState<Stops | null>(null);
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const labelRef = useRef<HTMLInputElement>(null);

  const create = () => {
    const amount = parseAmount(price);
    const problem = !label.trim()
      ? "Name the flight"
      : !stops
        ? "Pick the number of stops"
        : amount === null
          ? "Type the price"
          : null;
    if (problem || !stops || amount === null) {
      setError(problem);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createCandidateAction({
        tripId,
        searchId,
        label,
        stops,
        amount,
      });
      if (result) {
        setError(result.error);
        return;
      }
      setLabel("");
      setStops(null);
      setPrice("");
      labelRef.current?.focus();
    });
  };

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      create();
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-paper/50 px-4 py-2">
      <input
        ref={labelRef}
        value={label}
        onChange={(e) => {
          setLabel(e.target.value);
        }}
        onKeyDown={onEnter}
        placeholder="New candidate, e.g. BR 67 evening"
        aria-label="New candidate label"
        className="field min-w-32 flex-1 py-1"
        autoComplete="off"
      />
      <StopsChips value={stops} onChange={setStops} tabbable />
      <span className="w-36" />
      <input
        value={price}
        onChange={(e) => {
          setPrice(e.target.value);
        }}
        onKeyDown={onEnter}
        inputMode="decimal"
        placeholder="price"
        aria-label="First price for the new candidate"
        className="field w-28 py-1 text-right tabular-nums"
        autoComplete="off"
        disabled={pending}
      />
      <span className="w-3" />
      {error && (
        <p className="w-full text-right text-xs text-accent">{error}</p>
      )}
    </li>
  );
}
