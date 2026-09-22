import { appConfig } from "./config";
import { skyscannerIdentifier } from "./place";
import type { Search } from "./search";

/**
 * The only place in the codebase that knows Skyscanner's URL shape: the
 * de-facto consumer URL, one host, everything else as query params.
 */
export function buildSkyscannerUrl(search: Search): string {
  const segments = [
    skyscannerIdentifier(search.origin).toLowerCase(),
    skyscannerIdentifier(search.destination).toLowerCase(),
    toYymmdd(search.departureDate, "departure date"),
  ];
  if (search.returnDate !== null) {
    segments.push(toYymmdd(search.returnDate, "return date"));
  }

  const params = new URLSearchParams({
    adults: "1",
    cabinclass: "economy",
    rtn: search.returnDate === null ? "0" : "1",
    currency: search.currency,
    locale: appConfig.locale,
    market: appConfig.market,
  });

  return `https://www.skyscanner.net/transport/flights/${segments.join("/")}/?${params.toString()}`;
}

function toYymmdd(isoDate: string, label: string): string {
  const match = /^\d{2}(\d{2})-(\d{2})-(\d{2})$/.exec(isoDate);
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (
    !match ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== isoDate
  ) {
    throw new Error(`Unparseable ${label}: ${isoDate}`);
  }
  return match.slice(1).join("");
}
