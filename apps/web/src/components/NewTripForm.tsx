"use client";

import { useActionState } from "react";
import { createTripAction } from "@/app/actions";

export function NewTripForm() {
  const [state, action, pending] = useActionState(createTripAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-start gap-2">
      <input
        name="name"
        required
        placeholder="New trip, e.g. Taipei in December"
        className="field min-w-0 flex-1"
        autoComplete="off"
      />
      <button className="btn-primary" disabled={pending}>
        Create trip
      </button>
      {state?.error && (
        <p className="w-full text-sm text-accent">{state.error}</p>
      )}
    </form>
  );
}
