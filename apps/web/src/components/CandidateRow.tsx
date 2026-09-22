"use client";

import type { CandidateWithHistory } from "@reise-hq/db";
import { latestPrice, type Stops } from "@reise-hq/domain";
import { useState, useTransition } from "react";
import {
  deleteCandidateAction,
  logPriceAction,
  setStopsAction,
} from "@/app/actions";
import { formatMoney, parseAmount } from "@/lib/money";
import { StopsChips } from "./StopsChips";

const DELTA_STYLE = {
  up: { arrow: "▲", className: "text-up" },
  down: { arrow: "▼", className: "text-down" },
  flat: { arrow: "=", className: "text-muted" },
} as const;

/**
 * A Candidate as a row with a live price box: type, Enter, logged. Only the
 * price box is in the tab order, so the sweep is price-Enter-Tab-price-Enter.
 */
export function CandidateRow({
  tripId,
  currency,
  candidate,
}: {
  tripId: string;
  currency: string;
  candidate: CandidateWithHistory;
}) {
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const latest = latestPrice(candidate.observations);

  const log = () => {
    const amount = parseAmount(price);
    if (amount === null) {
      setError("Type an amount");
      return;
    }
    setError(null);
    setPrice("");
    startTransition(async () => {
      const result = await logPriceAction({
        tripId,
        candidateId: candidate.id,
        amount,
      });
      if (result) {
        setError(result.error);
        setPrice(String(amount));
      }
    });
  };

  const changeStops = (stops: Stops) => {
    startTransition(async () => {
      const result = await setStopsAction({
        tripId,
        candidateId: candidate.id,
        stops,
      });
      if (result) setError(result.error);
    });
  };

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
      <span className="min-w-32 flex-1 truncate font-medium">
        {candidate.label}
      </span>
      <StopsChips
        value={candidate.stops}
        onChange={changeStops}
        tabbable={false}
      />
      <span className="w-36 text-right text-sm tabular-nums">
        {latest && (
          <>
            <span className="font-semibold">
              {formatMoney(latest.amount, currency)}
            </span>
            {latest.delta && (
              <span
                className={`ml-2 text-xs ${DELTA_STYLE[latest.delta.direction].className}`}
                title="Against the previous observation"
              >
                {DELTA_STYLE[latest.delta.direction].arrow}{" "}
                {latest.delta.direction === "flat"
                  ? ""
                  : formatMoney(latest.delta.magnitude, currency)}
              </span>
            )}
          </>
        )}
      </span>
      <input
        value={price}
        onChange={(e) => {
          setPrice(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            log();
          }
        }}
        inputMode="decimal"
        placeholder="price now"
        aria-label={`Price now for ${candidate.label}`}
        aria-invalid={error !== null}
        className="field w-28 py-1 text-right tabular-nums"
        autoComplete="off"
      />
      {confirming ? (
        <span className="flex items-center gap-2 text-sm">
          <span className="text-accent">
            Delete {candidate.label}? Its price history (
            {candidate.observations.length}{" "}
            {candidate.observations.length === 1 ? "price" : "prices"}) goes
            with it.
          </span>
          <button
            type="button"
            className="font-semibold text-accent underline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await deleteCandidateAction({
                  tripId,
                  candidateId: candidate.id,
                });
              });
            }}
          >
            Delete
          </button>
          <button
            type="button"
            className="text-muted underline"
            onClick={() => {
              setConfirming(false);
            }}
          >
            Keep
          </button>
        </span>
      ) : (
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Delete ${candidate.label}`}
          className="text-muted hover:text-accent"
          onClick={() => {
            setConfirming(true);
          }}
        >
          ×
        </button>
      )}
      {error && (
        <p className="w-full text-right text-xs text-accent">{error}</p>
      )}
    </li>
  );
}
