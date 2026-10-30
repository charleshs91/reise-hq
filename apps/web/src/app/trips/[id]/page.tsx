import { getTripPage } from "@reise-hq/db";
import { buildSkyscannerUrl } from "@reise-hq/domain";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CandidateRow } from "@/components/CandidateRow";
import { NewCandidateRow } from "@/components/NewCandidateRow";
import { NewSearchForm } from "@/components/NewSearchForm";
import { formatDate } from "@/lib/dates";
import { db } from "@/lib/db";

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const page = getTripPage(db(), id);
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-accent">
          ← Trips
        </Link>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {page.trip.name}
        </h1>
      </div>

      {page.searches.map((search) => (
        <section
          key={search.id}
          className="overflow-hidden rounded-2xl border border-line bg-card"
        >
          <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-4 py-3">
            <h2 className="font-semibold">
              <span className="code">{search.origin.id}</span>
              <span className="mx-1.5 text-muted">→</span>
              <span className="code">{search.destination.id}</span>
              <span className="ml-3 text-sm font-normal text-muted">
                {search.origin.name} → {search.destination.name}
              </span>
            </h2>
            <span className="flex items-baseline gap-4 text-sm">
              <span className="text-muted">
                {formatDate(search.departureDate)}
                {search.returnDate
                  ? ` → ${formatDate(search.returnDate)}`
                  : " · one-way"}
              </span>
              <a
                href={buildSkyscannerUrl(search)}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-accent underline"
              >
                Skyscanner ↗
              </a>
            </span>
          </header>
          <ul className="divide-y divide-line">
            {search.candidates.map((candidate) => (
              <CandidateRow
                key={candidate.id}
                tripId={page.trip.id}
                currency={search.currency}
                candidate={candidate}
              />
            ))}
            <NewCandidateRow tripId={page.trip.id} searchId={search.id} />
          </ul>
        </section>
      ))}

      <NewSearchForm tripId={page.trip.id} />
    </main>
  );
}
