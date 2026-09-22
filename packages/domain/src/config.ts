/**
 * App-wide localisation for generated links. Skyscanner spells markets its own
 * way (`UK`, not `GB`). Currency here is only the default a new Search is stamped
 * with; the link uses the currency stored on the Search.
 */
export const appConfig = {
  currency: "GBP",
  locale: "en-GB",
  market: "UK",
} as const;
