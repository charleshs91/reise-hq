"use client";
/* eslint-disable -- PROTOTYPE, throwaway: not held to repo lint standards. */
// PROTOTYPE — throwaway switcher bar. Hidden in production builds.
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const VARIANTS = [
  { key: "A", name: "Drill-down" },
  { key: "B", name: "One-screen shelf" },
  { key: "C", name: "Capture bar" },
] as const;

export function PrototypeSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const go = (delta: number) => {
    const i = VARIANTS.findIndex((v) => v.key === current);
    const next = VARIANTS[(i + delta + VARIANTS.length) % VARIANTS.length];
    const p = new URLSearchParams(params);
    p.set("variant", next.key);
    router.replace(`${pathname}?${p}`, { scroll: false });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        (el as HTMLElement | null)?.isContentEditable
      )
        return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;

  const v = VARIANTS.find((x) => x.key === current) ?? VARIANTS[0];

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-fuchsia-600 px-2 py-1.5 text-sm font-medium text-white shadow-lg ring-2 ring-fuchsia-300">
      <button
        onClick={() => go(-1)}
        className="rounded-full px-2.5 py-1 hover:bg-fuchsia-500"
        aria-label="Previous variant"
      >
        ←
      </button>
      <span className="px-2 tabular-nums">
        {v.key} ({v.name})
      </span>
      <button
        onClick={() => go(1)}
        className="rounded-full px-2.5 py-1 hover:bg-fuchsia-500"
        aria-label="Next variant"
      >
        →
      </button>
    </div>
  );
}
