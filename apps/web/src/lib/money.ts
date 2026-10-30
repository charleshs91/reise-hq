/** What the User typed in a price box, as a positive amount, or null. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[\s,£$€¥]/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  return amount > 0 ? amount : null;
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}
