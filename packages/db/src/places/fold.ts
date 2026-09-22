/** Lowercase with diacritics stripped, so `zurich` finds `Zürich` and `istanbul` finds `İstanbul`. */
export function foldText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .normalize("NFC");
}
