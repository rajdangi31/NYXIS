import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/nyxis/AppShell";
import { PressureMeter } from "@/components/nyxis/PressureMeter";
import { StatGrid } from "@/components/nyxis/StatGrid";
import { hunter, quests, architectMessage } from "@/lib/mock-data";
import { Crosshair, Sparkles } from "lucide-react";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Status — NYXIS" },
      { name: "description", content: "Hunter identity, level, stats, and Shadow Pressure overview." },
    ],
  }),
  component: StatusPage,
});

function StatusPage() {
  const active = quests.filter((q) => q.status === "ACTIVE").length;
  const xpPct = Math.round((hunter.xp / hunter.xpNext) * 100);

  return (
    <AppShell title="Status / Identity" subtitle="Your Hunter profile and current system state">
      {/* Identity */}
      <section className="mb-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Hunter handle</p>
            <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">{hunter.handle}</h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Current rank</p>
            <p className="font-mono text-sm font-semibold text-neon-gold">{hunter.rank}</p>
          </div>
        </div>

        {/* Level bar */}
        <div className="mt-5 space-y-2">
          <div className="flex items-end justify-between font-mono text-[10px] uppercase tracking-widest">
            <span className="text-muted-foreground">
              Level <span className="text-foreground">{hunter.level}</span> · Evolution phase
            </span>
            <span className="text-neon-cyan">{hunter.xp.toLocaleString()} / {hunter.xpNext.toLocaleString()} XP</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-sm bg-surface">
            <div
              className="h-full bg-neon-cyan glow-cyan"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">{hunter.xpNext - hunter.xp} XP to level {hunter.level + 1}.</p>
        </div>
      </section>

      {/* Stats */}
      <section className="mb-8">
        <div className="mb-2">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">Vitals</h3>
          <p className="text-[11px] text-muted-foreground">Stat distribution — earned through completed directives</p>
        </div>
        <StatGrid stats={hunter.stats} />
      </section>

      {/* Pressure */}
      <section className="mb-8">
        <PressureMeter value={hunter.pressure} />
      </section>

      {/* Next action */}
      <section className="mb-8">
        <div className="mb-2">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">Next Action</h3>
          <p className="text-[11px] text-muted-foreground">The system's recommended move right now</p>
        </div>
        {active > 0 ? (
          <Link
            to="/directives"
            className="group flex items-center justify-between rounded-sm border border-neon-cyan/40 bg-neon-cyan/10 p-4 hover:bg-neon-cyan/15"
          >
            <div className="flex items-center gap-3">
              <Crosshair className="size-5 text-neon-cyan" />
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-neon-cyan">
                  Resolve active directives
                </p>
                <p className="text-[12px] text-muted-foreground">{active} live · submit proof to reduce pressure</p>
              </div>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-neon-cyan">Open →</span>
          </Link>
        ) : (
          <Link
            to="/architect"
            className="group flex items-center justify-between rounded-sm border border-neon-gold/40 bg-neon-gold/10 p-4 hover:bg-neon-gold/15"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-neon-gold" />
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-neon-gold">
                  Commune with Architect
                </p>
                <p className="text-[12px] text-muted-foreground">Generate a new quest path</p>
              </div>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-neon-gold">Initiate →</span>
          </Link>
        )}
      </section>

      {/* Architect snippet */}
      <section>
        <div className="mb-2">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-gold">Architect Transmission</h3>
          <p className="text-[11px] text-muted-foreground">Latest message from the system</p>
        </div>
        <div className="rounded-sm border border-neon-gold/20 bg-neon-gold/5 p-4">
          <div className="flex items-center gap-2">
            <span className="size-1.5 animate-pulse-glow rounded-full bg-neon-gold" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-neon-gold">Incoming // 02:14 ago</span>
          </div>
          <p className="mt-2 border-l border-neon-gold/30 pl-3 font-mono text-[12px] leading-relaxed text-foreground/90">
            {architectMessage}
          </p>
          <Link
            to="/architect"
            className="mt-3 inline-block font-mono text-[10px] uppercase tracking-widest text-neon-gold hover:underline"
          >
            Open transmission log →
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
