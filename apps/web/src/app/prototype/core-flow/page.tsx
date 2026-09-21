"use client";

// PROTOTYPE — throwaway route. Ticket 04 (core flow).
// Three variants of the whole core flow on one route, switchable via ?variant=.
// In-memory state only. Do not merge to main.
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PrototypeSwitcher } from "./PrototypeSwitcher";
import { VariantA } from "./VariantA";
import { VariantB } from "./VariantB";
import { VariantC } from "./VariantC";
import { useStore } from "./store";

function Inner() {
  const variant = (useSearchParams().get("variant") ?? "A").toUpperCase();
  const store = useStore();
  return (
    <>
      {variant === "B" ? (
        <VariantB store={store} />
      ) : variant === "C" ? (
        <VariantC store={store} />
      ) : (
        <VariantA store={store} />
      )}
      <PrototypeSwitcher current={variant} />
      <div className="h-20" />
    </>
  );
}

export default function CoreFlowPrototypePage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
