"use client";

import type { PlaceRow } from "@reise-hq/db";
import { useId, useRef, useState } from "react";
import { Highlight } from "./Highlight";
import { usePlaceSearch } from "./usePlaceSearch";

const displayName = (p: PlaceRow) =>
  p.kind === "citySlug" ? `${p.city ?? p.name}, every airport` : p.name;

/**
 * Type-to-search over the known Places. Holds no form value until a result is
 * picked: free text never becomes a Place. The settled Place is itself the
 * click target back into search.
 */
export function PlaceInput({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: PlaceRow | null;
  onChange: (place: PlaceRow | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const search = usePlaceSearch(query);

  const pick = (place: PlaceRow) => {
    onChange(place);
    setOpen(false);
    setQuery("");
  };

  const reopen = () => {
    onChange(null);
    setOpen(true);
    // The input mounts on this render; focus it once it exists.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  if (value) {
    return (
      <div>
        <span className="mb-1 block text-sm font-medium text-muted">
          {label}
        </span>
        <input type="hidden" name={name} value={value.id} />
        <button
          type="button"
          onClick={reopen}
          className="settled"
          aria-label={`${label}: ${value.name}. Change`}
        >
          <span className="code font-semibold">{value.id}</span>
          <span className="min-w-0 flex-1 truncate">{displayName(value)}</span>
          <span className="text-sm whitespace-nowrap text-muted">
            {value.country} · change
          </span>
        </button>
      </div>
    );
  }

  const showPanel = open && !search.tooShort;

  return (
    <div className="relative">
      <label>
        <span className="mb-1 block text-sm font-medium text-muted">
          {label}
        </span>
        <input
          ref={inputRef}
          value={query}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => {
            setOpen(true);
          }}
          onBlur={() => {
            setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, search.places.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              // Never submit the surrounding form from a half-typed query.
              e.preventDefault();
              const place = search.places.at(active);
              if (place) pick(place);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="City, airport or code"
          className="field"
          autoComplete="off"
        />
      </label>
      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-line bg-card shadow-panel"
        >
          {search.places.length === 0 && !search.pending && (
            <p className="px-3 py-3 text-sm text-muted">
              No matching airport or city — try the airport code
            </p>
          )}
          {search.places.map((place, i) => (
            <button
              key={place.id}
              type="button"
              role="option"
              aria-selected={i === active}
              // mousedown, not click: the input's blur would close the panel first.
              onMouseDown={(e) => {
                e.preventDefault();
                pick(place);
              }}
              onMouseEnter={() => {
                setActive(i);
              }}
              className={`flex w-full items-baseline gap-2.5 border-l-2 px-3 py-1 text-left text-sm ${
                i === active
                  ? "border-accent bg-accent-wash"
                  : "border-transparent"
              } ${place.kind === "citySlug" ? "font-semibold" : ""}`}
            >
              <span className="code w-11 shrink-0 text-xs text-muted">
                <Highlight text={place.id} query={query} prefixOnly />
              </span>
              <span className="min-w-0 flex-1 truncate">
                <Highlight text={displayName(place)} query={query} />
              </span>
              <span className="shrink-0 text-xs whitespace-nowrap text-muted">
                {place.kind === "airport" && place.city ? (
                  <Highlight text={place.city} query={query} />
                ) : (
                  "all airports"
                )}
                {", "}
                {place.country}
              </span>
            </button>
          ))}
          {search.total > search.places.length && (
            <p className="border-t border-line px-3 py-1.5 text-xs text-muted">
              showing {search.places.length} of {search.total}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
