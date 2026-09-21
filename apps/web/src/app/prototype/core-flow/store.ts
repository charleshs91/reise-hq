"use client";

// PROTOTYPE — throwaway. Shared in-memory store so all three variants mutate the same data.
import { useCallback, useState } from "react";
import { SEED, uid, type Stops, type Trip } from "./data";

export function useStore() {
  const [trips, setTrips] = useState<Trip[]>(SEED);

  const addTrip = useCallback((name: string) => {
    const id = uid();
    setTrips((t) => [...t, { id, name, searches: [] }]);
    return id;
  }, []);

  const addSearch = useCallback(
    (
      tripId: string,
      s: {
        originId: string;
        destinationId: string;
        departDate: string;
        returnDate?: string;
      },
    ) => {
      const id = uid();
      setTrips((ts) =>
        ts.map((t) =>
          t.id !== tripId
            ? t
            : {
                ...t,
                searches: [
                  ...t.searches,
                  {
                    id,
                    origin: { id: s.originId, name: s.originId },
                    destination: { id: s.destinationId, name: s.destinationId },
                    departDate: s.departDate,
                    returnDate: s.returnDate || undefined,
                    currency: "TWD",
                    candidates: [],
                  },
                ],
              },
        ),
      );
      return id;
    },
    [],
  );

  const addCandidate = useCallback(
    (
      searchId: string,
      label: string,
      stops: Stops,
      amount?: number,
      remark?: string,
    ) => {
      const id = uid();
      setTrips((ts) =>
        ts.map((t) => ({
          ...t,
          searches: t.searches.map((s) =>
            s.id !== searchId
              ? s
              : {
                  ...s,
                  candidates: [
                    ...s.candidates,
                    {
                      id,
                      label,
                      stops,
                      observations:
                        amount === undefined
                          ? []
                          : [
                              {
                                id: uid(),
                                amount,
                                observedAt: new Date().toISOString(),
                                remark,
                              },
                            ],
                    },
                  ],
                },
          ),
        })),
      );
      return id;
    },
    [],
  );

  const logPrice = useCallback(
    (candidateId: string, amount: number, remark?: string) => {
      setTrips((ts) =>
        ts.map((t) => ({
          ...t,
          searches: t.searches.map((s) => ({
            ...s,
            candidates: s.candidates.map((c) =>
              c.id !== candidateId
                ? c
                : {
                    ...c,
                    observations: [
                      ...c.observations,
                      {
                        id: uid(),
                        amount,
                        observedAt: new Date().toISOString(),
                        remark: remark || undefined,
                      },
                    ],
                  },
            ),
          })),
        })),
      );
    },
    [],
  );

  return { trips, addTrip, addSearch, addCandidate, logPrice };
}

export type Store = ReturnType<typeof useStore>;
