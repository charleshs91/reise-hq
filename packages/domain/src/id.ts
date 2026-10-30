import { v7 } from "uuid";

/** App-minted, time-ordered ids (ADR 0001): persistence stays a dumb sink. */
export function newId(): string {
  return v7();
}
