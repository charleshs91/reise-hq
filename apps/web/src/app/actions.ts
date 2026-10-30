"use server";
/* eslint-disable @typescript-eslint/require-await --
   Server Actions must be async; better-sqlite3 does the work synchronously. */

import {
  createCandidate,
  createSearch,
  createTrip,
  deleteCandidate,
  logPrice,
  searchPlaces,
  setStops,
  UnknownPlaceError,
  type PlaceSearchResult,
} from "@reise-hq/db";
import { STOPS, type Stops } from "@reise-hq/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

// Single-user and self-hosted (ADR 0001): there is no session to check yet.
// Every action still validates its input, because actions are reachable by POST.

export type ActionResult = { error: string } | undefined;

const formString = (form: FormData, key: string): string => {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
};

const isStops = (value: unknown): value is Stops =>
  typeof value === "string" && (STOPS as readonly string[]).includes(value);

const failure = (error: unknown): ActionResult => ({
  error: error instanceof Error ? error.message : "Something went wrong",
});

export async function createTripAction(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  let id: string;
  try {
    id = createTrip(db(), formString(form, "name"));
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/");
  redirect(`/trips/${id}`);
}

export async function searchPlacesAction(
  query: string,
): Promise<PlaceSearchResult> {
  return searchPlaces(db(), query);
}

export async function createSearchAction(input: {
  tripId: string;
  originId: string;
  destinationId: string;
  departureDate: string;
  returnDate: string | null;
}): Promise<ActionResult> {
  try {
    createSearch(db(), input);
  } catch (error) {
    if (error instanceof UnknownPlaceError) {
      return { error: "Pick both Places from the list" };
    }
    return failure(error);
  }
  revalidatePath(`/trips/${input.tripId}`);
  return undefined;
}

export async function createCandidateAction(input: {
  tripId: string;
  searchId: string;
  label: string;
  stops: string;
  amount: number;
}): Promise<ActionResult> {
  if (!isStops(input.stops)) return { error: "Pick the number of stops" };
  try {
    createCandidate(db(), {
      searchId: input.searchId,
      label: input.label,
      stops: input.stops,
      amount: input.amount,
      observedAt: new Date().toISOString(),
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/trips/${input.tripId}`);
  return undefined;
}

export async function logPriceAction(input: {
  tripId: string;
  candidateId: string;
  amount: number;
}): Promise<ActionResult> {
  try {
    logPrice(db(), {
      candidateId: input.candidateId,
      amount: input.amount,
      observedAt: new Date().toISOString(),
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/trips/${input.tripId}`);
  return undefined;
}

export async function setStopsAction(input: {
  tripId: string;
  candidateId: string;
  stops: string;
}): Promise<ActionResult> {
  if (!isStops(input.stops)) return { error: "Unknown stops value" };
  try {
    setStops(db(), input.candidateId, input.stops);
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/trips/${input.tripId}`);
  return undefined;
}

export async function deleteCandidateAction(input: {
  tripId: string;
  candidateId: string;
}): Promise<ActionResult> {
  try {
    deleteCandidate(db(), input.candidateId);
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/trips/${input.tripId}`);
  return undefined;
}
