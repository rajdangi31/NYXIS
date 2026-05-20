import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/nyxis/AppShell";
import { architectMessage, behaviorProfile } from "@/lib/mock-data";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/architect")({
  head: () => ({
    meta: [
      { title: "Architect — NYXIS" },
      { name: "description", content: "Read transmissions and request a new quest path from the Architect." },
    ],
  }),
  component: ArchitectPage,
});

const transmissions = [
  { id: "t1", time: "02:14 ago", body: architectMessage },
  {
    id: "t2",
    time: "yesterday",
    body:
      "Your push session was accepted with a score of 88. Stat STR advanced. Maintain this cadence three more days and a Rank Gate will open.",
  },
  {
    id: "t3",
    time: "2d ago",
    body:
      "Weekly review submission was rejected. The reflection lacked measurable outcomes. Avoidance pattern up 6%. Resubmit before next evaluation.",
  },
];

function ArchitectPage() {
  return (
    <AppShell title="Architect / System" subtitle="Direct transmissions from the system">
      <section className="mb-6">
        <div className="rounded-sm border border-neon-gold/30 bg-neon-gold/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neon-gold">
            Commune with Architect
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Request a regenerated quest path based on your latest behavior profile.
          </p>
          <button className="mt-3 flex w-full items-center justify-between rounded-sm bg-neon-gold px-4 py-3 text-background hover:brightness-110">
            <span className="flex items-center gap-2">
              <Sparkles className="size-4" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                Generate Quest Path
              </span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest">Initiate →</span>
          </button>
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-3">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">
            Transmission Log
          </h3>
          <p className="text-[11px] text-muted-foreground">Most recent first</p>
        </div>
        <div className="space-y-2">
          {transmissions.map((t) => (
            <article key={t.id} className="border-l-2 border-neon-gold/40 bg-surface/40 p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-neon-gold">
                Architect // {t.time}
              </p>
              <p className="mt-1.5 font-mono text-[12px] leading-relaxed text-foreground/90">{t.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">
            Evaluation Report
          </h3>
          <p className="text-[11px] text-muted-foreground">How the system is reading you</p>
        </div>
        <ul className="space-y-2 rounded-sm border border-border bg-surface/40 p-4 font-mono text-[12px]">
          <li className="flex justify-between">
            <span className="text-muted-foreground">Consistency</span>
            <span className="text-neon-cyan">{behaviorProfile.consistency}% — Holding</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">Avoidance</span>
            <span className="text-neon-gold">{behaviorProfile.avoidance}% — Watch this</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">Intensity</span>
            <span className="text-neon-cyan">{behaviorProfile.intensity}% — Forged tier</span>
          </li>
        </ul>
      </section>
    </AppShell>
  );
}
