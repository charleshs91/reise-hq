const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * Marks the matched run so the User can see why a row is listed. Folding
 * `NFD` keeps one base letter per character for the scripts in the dataset,
 * so indices in the folded text map back onto the original.
 */
export function Highlight({
  text,
  query,
  prefixOnly = false,
}: {
  text: string;
  query: string;
  /** Identifiers match by prefix only, so only a prefix is marked. */
  prefixOnly?: boolean;
}) {
  const needle = fold(query.trim());
  const found = needle ? fold(text).indexOf(needle) : -1;
  const index = prefixOnly && found > 0 ? -1 : found;
  if (index < 0) return <>{text}</>;
  const end = index + needle.length;
  return (
    <>
      {text.slice(0, index)}
      <mark className="mark">{text.slice(index, end)}</mark>
      {text.slice(end)}
    </>
  );
}
