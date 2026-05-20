import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/nyxis/AppShell";
import { LifeBuoy, Moon, Droplets, Footprints } from "lucide-react";

export const Route = createFileRoute("/recovery")({
  head: () => ({
    meta: [
      { title: "Recovery — NYXIS" },
      { name: "description", content: "Survival Protocol — guided recovery when pressure spikes." },
    ],
  }),
  component: RecoveryPage,
});

const microQuests = [
  { Icon: Droplets,   title: "HYDRATE", sub: "Drink 500ml of water now", xp: 20 },
  { Icon: Footprints, title: "WALK 10",  sub: "Walk outside for 10 minutes", xp: 40 },
  { Icon: Moon,       title: "SLEEP WINDOW", sub: "Be in bed by 23:00 tonight", xp: 60 },
];

function RecoveryPage() {
  // simulate high pressure context
  const pressure = 78;
  return (
    <AppShell title="Recovery / Survival Protocol" subtitle="What to do when pressure spikes">
      {/* Header card */}
      <section className="mb-6">
        <div className="relative overflow-hidden rounded-sm border border-neon-magenta/30 bg-neon-magenta/5 p-5">
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <LifeBuoy className="size-4 text-neon-magenta" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-neon-magenta">
                Survival Protocol Active
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Recovery Mode</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Shadow Pressure is at <span className="font-mono text-neon-magenta">{pressure}%</span>. The system is not
              punishing you. It is guiding you back to baseline with small, easy wins.
            </p>
          </div>
        </div>
      </section>

      {/* Plain path */}
      <section className="mb-6">
        <div className="mb-3">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">
            Path to reduce pressure
          </h3>
          <p className="text-[11px] text-muted-foreground">Complete any of these to bring pressure down today</p>
        </div>
        <div className="space-y-2">
          {microQuests.map(({ Icon, title, sub, xp }) => (
            <div
              key={title}
              className="flex items-center justify-between border-l-2 border-neon-green bg-surface/60 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-sm border border-neon-green/30 bg-neon-green/10 text-neon-green">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-foreground">{title}</p>
                  <p className="text-[12px] text-muted-foreground">{sub}</p>
                </div>
              </div>
              <button className="rounded-sm border border-neon-green/40 bg-neon-green/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-neon-green hover:bg-neon-green/20">
                Mark done · −5% pressure
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Reassurance */}
      <section>
        <div className="rounded-sm border border-border bg-surface/40 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neon-cyan">Plain truth</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            Pressure isn't failure. It's the system noticing you're carrying weight. Knock out two of the recovery
            actions above and your normal directives will return. No XP is lost during recovery.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
