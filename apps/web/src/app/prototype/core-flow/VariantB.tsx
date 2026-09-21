"use client";
/* eslint-disable -- PROTOTYPE, throwaway: not held to repo lint standards. */
// PROTOTYPE — Variant B: One-screen shelf. No navigation at all. Every trip,
// search and candidate is on one page, and every candidate row carries a live
// price box: type a number, hit Enter, observation logged. History is a strip.
import { useState } from "react";
import {
  buildSkyscannerUrl,
  cheapest,
  isRoundTrip,
  latest,
  money,
  trend,
  when,
  type Candidate,
  type Search,
  type Stops,
} from "./data";
import type { Store } from "./store";

export function VariantB({ store }: { store: Store }) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">The shelf</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Everything at once. Tab to any price box, type, Enter.
      </p>

      {store.trips.map((trip) => (
        <section key={trip.id} className="mb-10">
          <h2 className="mb-3 border-b border-zinc-200 pb-1 text-lg font-semibold dark:border-zinc-800">
            {trip.name}
          </h2>
          {trip.searches.map((s) => (
            <SearchBlock key={s.id} search={s} store={store} />
          ))}
        </section>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const v = String(f.get("name") ?? "").trim();
          if (v) {
            store.addTrip(v);
            e.currentTarget.reset();
          }
        }}
      >
        <input name="name" placeholder="+ new trip" className={inputCls} />
      </form>
    </div>
  );
}

function SearchBlock({ search, store }: { search: Search; store: Store }) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium">
          {search.origin.name} → {search.destination.name}{" "}
          <span className="font-normal text-zinc-500">
            {search.departDate}
            {search.returnDate ? ` – ${search.returnDate}` : ""} ·{" "}
            {isRoundTrip(search) ? "round trip" : "one-way"} · {search.currency}
          </span>
        </h3>
        <a
          href={buildSkyscannerUrl(search)}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
        >
          Skyscanner ↗
        </a>
      </div>

      <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {search.candidates.map((c) => (
          <CandidateRow
            key={c.id}
            candidate={c}
            currency={search.currency}
            onLog={store.logPrice}
          />
        ))}
        <NewCandidateRow
          onAdd={(label, stops, amount) =>
            store.addCandidate(search.id, label, stops, amount)
          }
        />
      </div>
    </div>
  );
}

function CandidateRow({
  candidate,
  currency,
  onLog,
}: {
  candidate: Candidate;
  currency: string;
  onLog: Store["logPrice"];
}) {
  const [v, setV] = useState("");
  const [flash, setFlash] = useState(false);
  const l = latest(candidate);
  const t = trend(candidate);
  const best = cheapest(candidate);

  const submit = () => {
    if (!v) return;
    onLog(candidate.id, Number(v));
    setV("");
    setFlash(true);
    setTimeout(() => setFlash(false), 700);
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors ${flash ? "bg-emerald-50 dark:bg-emerald-950" : ""}`}
    >
      <div className="min-w-48 flex-1">
        <div className="font-medium">{candidate.label}</div>
        <div className="text-xs text-zinc-500">
          {candidate.stops}
          {best ? ` · best ${money(best.amount, currency)}` : ""}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-zinc-500 tabular-nums">
        {candidate.observations.slice(-5).map((o) => (
          <span
            key={o.id}
            title={`${when(o.observedAt)}${o.remark ? ` — ${o.remark}` : ""}`}
            className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800"
          >
            {Math.round(o.amount / 100) / 10}k
          </span>
        ))}
        {candidate.observations.length === 0 && (
          <span className="italic">no history</span>
        )}
      </div>

      <div className="w-28 text-right text-sm tabular-nums">
        {l ? (
          <>
            <span className="font-medium">{money(l.amount, currency)}</span>{" "}
            <span
              className={
                t === "up"
                  ? "text-red-600"
                  : t === "down"
                    ? "text-emerald-600"
                    : "text-zinc-400"
              }
            >
              {t === "up" ? "↑" : t === "down" ? "↓" : t === "flat" ? "→" : ""}
            </span>
            <div className="text-xs text-zinc-500">{when(l.observedAt)}</div>
          </>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </div>

      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        inputMode="numeric"
        placeholder="log price"
        aria-label={`Log price for ${candidate.label}`}
        className="w-28 rounded-lg border border-zinc-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-300"
      />
    </div>
  );
}

function NewCandidateRow({
  onAdd,
}: {
  onAdd: (label: string, stops: Stops, amount?: number) => void;
}) {
  const [label, setLabel] = useState("");
  const [stops, setStops] = useState<Stops>("direct");
  const [amount, setAmount] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (label.trim()) {
          onAdd(label.trim(), stops, amount ? Number(amount) : undefined);
          setLabel("");
          setAmount("");
        }
      }}
      className="flex flex-wrap items-center gap-2 bg-zinc-50 px-4 py-2.5 dark:bg-zinc-900/50"
    >
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="+ candidate, e.g. JAL direct 09:30"
        className={`flex-1 ${inputCls}`}
      />
      <select
        value={stops}
        onChange={(e) => setStops(e.target.value as Stops)}
        className={inputCls}
      >
        <option value="direct">direct</option>
        <option value="one-stop">one-stop</option>
        <option value="two-plus">two-plus</option>
      </select>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="numeric"
        placeholder="price"
        className={`w-28 ${inputCls}`}
      />
    </form>
  );
}

const inputCls =
  "rounded-lg border border-zinc-300 bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-300";
