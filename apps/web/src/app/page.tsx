import { tripDurationInDays, type Trip } from "@reise-hq/domain";

const sampleTrip: Trip = {
  id: "sample",
  destination: "Lisbon",
  startDate: "2026-04-01",
  endDate: "2026-04-05",
};

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">reise-hq</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Toolchain scaffold. The line below is rendered from{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-zinc-800">
          @reise-hq/domain
        </code>
        , which proves the workspace boundary resolves.
      </p>
      <p className="text-zinc-600 dark:text-zinc-400">
        {sampleTrip.destination}: {tripDurationInDays(sampleTrip)} days
      </p>
    </main>
  );
}
