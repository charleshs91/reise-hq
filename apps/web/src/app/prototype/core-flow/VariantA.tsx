"use client";
/* eslint-disable -- PROTOTYPE, throwaway: not held to repo lint standards. */
// PROTOTYPE — Variant A: Drill-down. One thing on screen at a time; logging a
// price is a deliberate act reached by navigating Trip → Search → Candidate.
import { useState } from "react";
import {
  buildSkyscannerUrl,
  cheapest,
  isRoundTrip,
  latest,
  money,
  when,
  type Stops,
} from "./data";
import type { Store } from "./store";

export function VariantA({ store }: { store: Store }) {
  const [tripId, setTripId] = useState<string | null>(null);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  const trip = store.trips.find((t) => t.id === tripId);
  const search = trip?.searches.find((s) => s.id === searchId);
  const candidate = search?.candidates.find((c) => c.id === candidateId);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-zinc-500">
        <Crumb
          onClick={() => {
            setTripId(null);
            setSearchId(null);
            setCandidateId(null);
          }}
        >
          Trips
        </Crumb>
        {trip && (
          <>
            <span>/</span>
            <Crumb
              onClick={() => {
                setSearchId(null);
                setCandidateId(null);
              }}
            >
              {trip.name}
            </Crumb>
          </>
        )}
        {search && (
          <>
            <span>/</span>
            <Crumb onClick={() => setCandidateId(null)}>
              {search.origin.name} → {search.destination.name}
            </Crumb>
          </>
        )}
        {candidate && (
          <>
            <span>/</span>
            <span className="text-zinc-900 dark:text-zinc-100">
              {candidate.label}
            </span>
          </>
        )}
      </nav>

      {!trip && (
        <Level title="Trips">
          {store.trips.map((t) => (
            <Row
              key={t.id}
              onClick={() => setTripId(t.id)}
              main={t.name}
              meta={`${t.searches.length} searches`}
            />
          ))}
          <InlineAdd
            placeholder="New trip name…"
            onSubmit={(v) => store.addTrip(v)}
          />
        </Level>
      )}

      {trip && !search && (
        <Level title="Searches">
          {trip.searches.map((s) => (
            <Row
              key={s.id}
              onClick={() => setSearchId(s.id)}
              main={`${s.origin.name} → ${s.destination.name}`}
              meta={`${s.departDate}${s.returnDate ? ` – ${s.returnDate}` : " (one-way)"} · ${s.candidates.length} candidates`}
            />
          ))}
          <SearchAdd onSubmit={(v) => store.addSearch(trip.id, v)} />
        </Level>
      )}

      {search && !candidate && (
        <Level title="Candidates">
          <a
            href={buildSkyscannerUrl(search)}
            target="_blank"
            rel="noreferrer"
            className="mb-4 block rounded-lg bg-sky-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-sky-500"
          >
            Open on Skyscanner ↗ (
            {isRoundTrip(search) ? "round trip" : "one-way"})
          </a>
          {search.candidates.map((c) => {
            const l = latest(c);
            return (
              <Row
                key={c.id}
                onClick={() => setCandidateId(c.id)}
                main={c.label}
                meta={`${c.stops} · ${c.observations.length} observations`}
                right={
                  l
                    ? `${money(l.amount, search.currency)} · ${when(l.observedAt)}`
                    : "no price yet"
                }
              />
            );
          })}
          <CandidateAdd
            onSubmit={(label, stops, amount) =>
              store.addCandidate(search.id, label, stops, amount)
            }
          />
        </Level>
      )}

      {search && candidate && (
        <Level title={candidate.label}>
          <p className="mb-4 text-sm text-zinc-500">
            {candidate.stops} · cheapest seen{" "}
            {cheapest(candidate)
              ? money(cheapest(candidate)!.amount, search.currency)
              : "—"}
          </p>
          <ol className="mb-6 divide-y divide-zinc-200 dark:divide-zinc-800">
            {[...candidate.observations].reverse().map((o) => (
              <li
                key={o.id}
                className="flex items-baseline justify-between gap-4 py-2.5"
              >
                <span className="font-medium tabular-nums">
                  {money(o.amount, search.currency)}
                </span>
                <span className="text-sm text-zinc-500">
                  {o.remark ? `${o.remark} · ` : ""}
                  {when(o.observedAt)}
                </span>
              </li>
            ))}
            {candidate.observations.length === 0 && (
              <li className="py-2.5 text-sm text-zinc-500">
                No observations yet.
              </li>
            )}
          </ol>
          <PriceForm
            onSubmit={(amount, remark) =>
              store.logPrice(candidate.id, amount, remark)
            }
          />
        </Level>
      )}
    </div>
  );
}

function Crumb({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded px-1 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {children}
    </button>
  );
}

function Level({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Row({
  main,
  meta,
  right,
  onClick,
}: {
  main: string;
  meta?: string;
  right?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="mb-2 flex w-full items-center justify-between gap-4 rounded-lg border border-zinc-200 px-4 py-3 text-left hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <span>
        <span className="block font-medium">{main}</span>
        {meta && <span className="block text-sm text-zinc-500">{meta}</span>}
      </span>
      {right && (
        <span className="shrink-0 text-sm text-zinc-500 tabular-nums">
          {right}
        </span>
      )}
    </button>
  );
}

function InlineAdd({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (v: string) => void;
}) {
  const [v, setV] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) {
          onSubmit(v.trim());
          setV("");
        }
      }}
      className="mt-4"
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </form>
  );
}

function SearchAdd({
  onSubmit,
}: {
  onSubmit: (v: {
    originId: string;
    destinationId: string;
    departDate: string;
    returnDate?: string;
  }) => void;
}) {
  const [o, setO] = useState("Taipei (TPE)");
  const [d, setD] = useState("");
  const [dep, setDep] = useState("");
  const [ret, setRet] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (d && dep) {
          onSubmit({
            originId: o,
            destinationId: d,
            departDate: dep,
            returnDate: ret,
          });
          setD("");
          setDep("");
          setRet("");
        }
      }}
      className="mt-4 grid grid-cols-2 gap-2"
    >
      <input
        value={o}
        onChange={(e) => setO(e.target.value)}
        placeholder="From"
        className={inputCls}
      />
      <input
        value={d}
        onChange={(e) => setD(e.target.value)}
        placeholder="To"
        className={inputCls}
      />
      <input
        type="date"
        value={dep}
        onChange={(e) => setDep(e.target.value)}
        className={inputCls}
      />
      <input
        type="date"
        value={ret}
        onChange={(e) => setRet(e.target.value)}
        className={inputCls}
      />
      <button className="col-span-2 rounded-lg border border-zinc-300 py-2 text-sm font-medium dark:border-zinc-700">
        Add search
      </button>
    </form>
  );
}

function CandidateAdd({
  onSubmit,
}: {
  onSubmit: (label: string, stops: Stops, amount?: number) => void;
}) {
  const [label, setLabel] = useState("");
  const [stops, setStops] = useState<Stops>("direct");
  const [amount, setAmount] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (label.trim()) {
          onSubmit(label.trim(), stops, amount ? Number(amount) : undefined);
          setLabel("");
          setAmount("");
        }
      }}
      className="mt-4 grid grid-cols-3 gap-2"
    >
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g. BA direct 07:55"
        className={`col-span-3 ${inputCls}`}
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
        className={inputCls}
      />
      <button className="rounded-lg border border-zinc-300 py-2 text-sm font-medium dark:border-zinc-700">
        Add candidate
      </button>
    </form>
  );
}

function PriceForm({
  onSubmit,
}: {
  onSubmit: (amount: number, remark?: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (amount) {
          onSubmit(Number(amount), remark);
          setAmount("");
          setRemark("");
        }
      }}
      className="grid grid-cols-3 gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <input
        autoFocus
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="numeric"
        placeholder="Price today"
        className={inputCls}
      />
      <input
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
        placeholder="Remark (optional)"
        className={inputCls}
      />
      <button className="rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
        Log price
      </button>
    </form>
  );
}

const inputCls =
  "rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-300";
