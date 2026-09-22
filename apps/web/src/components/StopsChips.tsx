"use client";

import { STOPS, type Stops } from "@reise-hq/domain";

const LABELS: Record<Stops, string> = {
  direct: "direct",
  "one-stop": "1 stop",
  "two-plus": "2+",
};

/** All three visible, one tap to select. `tabbable` is off on logged rows to keep the sweep tight. */
export function StopsChips({
  value,
  onChange,
  tabbable,
}: {
  value: Stops | null;
  onChange: (stops: Stops) => void;
  tabbable: boolean;
}) {
  return (
    <span className="flex gap-1" role="group" aria-label="Stops">
      {STOPS.map((stops) => (
        <button
          key={stops}
          type="button"
          className="chip"
          aria-pressed={value === stops}
          tabIndex={tabbable ? 0 : -1}
          onClick={() => {
            onChange(stops);
          }}
        >
          {LABELS[stops]}
        </button>
      ))}
    </span>
  );
}
