"use client";

import { useEffect, useRef, useState } from "react";
import {
  addMonths,
  monthGrid,
  nights,
  pickDate,
  type Range,
} from "@/lib/calendar";
import { formatDate, todayIso } from "@/lib/dates";

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

function Month({
  month,
  range,
  hover,
  onHover,
  onPick,
}: {
  month: string;
  range: Range;
  hover: string;
  onHover: (day: string) => void;
  onPick: (day: string) => void;
}) {
  const today = todayIso();
  const end =
    range.return || (range.departure && hover > range.departure ? hover : "");
  return (
    <div className="w-[15.5rem]">
      <p className="mb-2 text-center text-sm font-semibold">
        {monthLabel(month)}
      </p>
      <div className="grid grid-cols-7 text-center text-[0.6875rem] text-muted">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthGrid(month).map((day, i) => {
          if (!day) return <span key={i} />;
          const past = day < today;
          const edge = day === range.departure || day === range.return;
          const inSpan = Boolean(
            range.departure && end && day > range.departure && day <= end,
          );
          return (
            <button
              key={day}
              type="button"
              disabled={past}
              onMouseEnter={() => {
                onHover(day);
              }}
              onClick={() => {
                onPick(day);
              }}
              aria-label={formatDate(day)}
              aria-pressed={edge}
              className={`h-9 text-sm tabular-nums ${
                edge
                  ? "rounded-full bg-accent font-semibold text-accent-ink"
                  : inSpan
                    ? "bg-accent-wash"
                    : past
                      ? "cursor-not-allowed text-muted opacity-40"
                      : "rounded-full hover:bg-accent-wash"
              }`}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * One two-month picker for departure and return: one decision, one constraint.
 * One-way is an explicit action; it saves the Search with no return date.
 */
export function DateRange({
  range,
  onChange,
  onSaveOneWay,
}: {
  range: Range;
  onChange: (range: Range) => void;
  onSaveOneWay: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState("");
  const [cursor, setCursor] = useState(() =>
    (range.departure || todayIso()).slice(0, 7),
  );
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (day: string) => {
    const next = pickDate(range, day);
    const picked = { departure: next.departure, return: next.return };
    onChange(picked);
    if (next.done) setOpen(false);
  };

  const summary = range.departure
    ? range.return
      ? `${formatDate(range.departure)} → ${formatDate(range.return)}`
      : `${formatDate(range.departure)} → return?`
    : "Pick your dates";

  return (
    <div className="relative" ref={box}>
      <span className="mb-1 block text-sm font-medium text-muted">Dates</span>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
        }}
        className={
          range.departure
            ? "settled justify-between"
            : "field flex items-center justify-between"
        }
      >
        <span className={range.departure ? "" : "opacity-70"}>{summary}</span>
        <span className="text-sm whitespace-nowrap text-muted">
          {range.departure && range.return
            ? `${String(nights(range.departure, range.return))} nights`
            : ""}
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 rounded-2xl border border-line bg-card p-4 shadow-panel">
          <div className="mb-1 flex items-center justify-between text-muted">
            <button
              type="button"
              onClick={() => {
                setCursor(addMonths(cursor, -1));
              }}
              className="rounded-md px-2 py-1 hover:bg-accent-wash"
              aria-label="Previous month"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => {
                setCursor(addMonths(cursor, 1));
              }}
              className="rounded-md px-2 py-1 hover:bg-accent-wash"
              aria-label="Next month"
            >
              →
            </button>
          </div>
          <div
            className="flex flex-wrap gap-6"
            onMouseLeave={() => {
              setHover("");
            }}
          >
            {[0, 1].map((n) => (
              <Month
                key={n}
                month={addMonths(cursor, n)}
                range={range}
                hover={hover}
                onHover={setHover}
                onPick={pick}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 border-t border-line pt-3 text-sm text-muted">
            <span>
              {range.departure && hover > range.departure && !range.return
                ? `${String(nights(range.departure, hover))} nights`
                : range.departure
                  ? "Pick the day you come back"
                  : "Pick the day you leave"}
            </span>
            <button
              type="button"
              disabled={!range.departure}
              onClick={() => {
                onChange({ departure: range.departure, return: "" });
                setOpen(false);
                onSaveOneWay();
              }}
              className="btn-primary text-sm"
            >
              Save as one-way
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
