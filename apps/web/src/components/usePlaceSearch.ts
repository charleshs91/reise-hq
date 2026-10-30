"use client";

import type { PlaceSearchResult } from "@reise-hq/db";
import { useEffect, useRef, useState } from "react";
import { searchPlacesAction } from "@/app/actions";

export const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 150;
const EMPTY: PlaceSearchResult = { places: [], total: 0 };

/**
 * Debounced Server Action per keystroke. A response is kept with the query it
 * answers, so a stale one never shows as current and "pending" is derived.
 */
export function usePlaceSearch(query: string) {
  const [answered, setAnswered] = useState<{
    query: string;
    result: PlaceSearchResult;
  }>({
    query: "",
    result: EMPTY,
  });
  const latest = useRef(0);
  const tooShort = query.trim().length < MIN_QUERY_LENGTH;

  useEffect(() => {
    if (tooShort) return;
    const mine = ++latest.current;
    const timer = setTimeout(() => {
      void searchPlacesAction(query).then((result) => {
        if (mine === latest.current) setAnswered({ query, result });
      });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [query, tooShort]);

  if (tooShort) return { ...EMPTY, pending: false, tooShort };
  return { ...answered.result, pending: answered.query !== query, tooShort };
}
