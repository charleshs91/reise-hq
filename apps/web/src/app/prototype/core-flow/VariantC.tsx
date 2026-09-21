"use client";
/* eslint-disable -- PROTOTYPE, throwaway: not held to repo lint standards. */
// PROTOTYPE — Variant C: Capture bar. The repeat-logging loop is the product,
// so it owns the top of the screen: pick a candidate, type a price, Enter.
// The page below is a reverse-chronological log, not a hierarchy.
import { useMemo, useRef, useState } from "react";
import { buildSkyscannerUrl, cheapest, money, when, type Stops } from "./data";
import type { Store } from "./store";

export function VariantC({ store }: { store: Store }) {
  const [searchId, setSearchId] = useState<string>("s1");
  const [candidateId, setCandidateId] = useState<string>("c1");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newStops, setNewStops] = useState<Stops>("direct");
  const amountRef = useRef<HTMLInputElement>(null);

  const searches = store.trips.flatMap((t) =>
    t.searches.map((s) => ({ trip: t, search: s })),
  );
  const active = searches.find((x) => x.search.id === searchId) ?? searches[0];
  const candidates = active?.search.candidates ?? [];
  const candidate = candidates.find((c) => c.id === candidateId);

  const feed = useMemo(() => {
    const rows = store.trips.flatMap((t) =>
      t.searches.flatMap((s) =>
        s.candidates.flatMap((c) =>
          c.observations.map((o) => ({ o, c, s, t })),
        ),
      ),
    );
    return rows.sort(
      (a, b) => Date.parse(b.o.observedAt) - Date.parse(a.o.observedAt),
    );
  }, [store.trips]);

  const log = () => {
    if (!amount) return;
    if (candidate) {
      store.logPrice(candidate.id, Number(amount), remark);
    } else if (newLabel.trim() && active) {
      store.addCandidate(
        active.search.id,
        newLabel.trim(),
        newStops,
        Number(amount),
        remark || undefined,
      );
      setNewLabel("");
    }
    setAmount("");
    setRemark("");
    amountRef.current?.focus();
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            log();
          }}
          className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-6 py-3"
        >
          <select
            value={searchId}
            onChange={(e) => {
              setSearchId(e.target.value);
              const s = searches.find(
                (x) => x.search.id === e.target.value,
              )?.search;
              setCandidateId(s?.candidates[0]?.id ?? "__new");
            }}
            className={inputCls}
          >
            {searches.map(({ trip, search }) => (
              <option key={search.id} value={search.id}>
                {trip.name}: {search.origin.name}→{search.destination.name}
              </option>
            ))}
          </select>

          <select
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            className={`flex-1 ${inputCls}`}
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} ({c.stops})
              </option>
            ))}
            <option value="__new">+ new candidate…</option>
          </select>

          {!candidate && (
            <>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="label"
                className={`w-44 ${inputCls}`}
              />
              <select
                value={newStops}
                onChange={(e) => setNewStops(e.target.value as Stops)}
                className={inputCls}
              >
                <option value="direct">direct</option>
                <option value="one-stop">one-stop</option>
                <option value="two-plus">two-plus</option>
              </select>
            </>
          )}

          <input
            ref={amountRef}
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            placeholder={active ? active.search.currency : "price"}
            className={`w-24 ${inputCls}`}
          />
          <input
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="remark"
            className={`w-36 ${inputCls}`}
          />
          <button className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
            Log ⏎
          </button>
          {active && (
            <a
              href={buildSkyscannerUrl(active.search)}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
            >
              Skyscanner ↗
            </a>
          )}
        </form>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {candidate && (
          <div className="mb-8 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="text-sm text-zinc-500">Logging into</div>
            <div className="text-lg font-medium">{candidate.label}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm tabular-nums">
              {candidate.observations.map((o) => (
                <span
                  key={o.id}
                  className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800"
                >
                  {money(o.amount, active.search.currency)}{" "}
                  <span className="text-zinc-500">{when(o.observedAt)}</span>
                </span>
              ))}
              {candidate.observations.length === 0 && (
                <span className="text-zinc-500">First observation.</span>
              )}
            </div>
            {cheapest(candidate) && (
              <div className="mt-2 text-sm text-zinc-500">
                Cheapest seen{" "}
                {money(cheapest(candidate)!.amount, active.search.currency)}
              </div>
            )}
          </div>
        )}

        <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase">
          Everything logged
        </h2>
        <ol className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {feed.map(({ o, c, s, t }) => (
            <li
              key={o.id}
              className="flex items-baseline justify-between gap-4 py-2.5"
            >
              <span>
                <span className="font-medium tabular-nums">
                  {money(o.amount, s.currency)}
                </span>{" "}
                <button
                  onClick={() => {
                    setSearchId(s.id);
                    setCandidateId(c.id);
                    amountRef.current?.focus();
                  }}
                  className="hover:underline"
                >
                  {c.label}
                </button>
                <span className="block text-xs text-zinc-500">
                  {t.name} · {s.origin.name}→{s.destination.name}
                  {o.remark ? ` · ${o.remark}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-sm text-zinc-500">
                {when(o.observedAt)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

const inputCls =
  "rounded-lg border border-zinc-300 bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-300";
