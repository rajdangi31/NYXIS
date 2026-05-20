import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/nyxis/AppShell";
import { PressureMeter } from "@/components/nyxis/PressureMeter";
import { QuestCard } from "@/components/nyxis/QuestCard";
import { ProofModal } from "@/components/nyxis/ProofModal";
import { quests as seedQuests, hunter, behaviorProfile, architectMessage } from "@/lib/mock-data";
import type { Quest } from "@/lib/mock-data";
import { Sparkles, Target } from "lucide-react";

export const Route = createFileRoute("/directives")({
  head: () => ({
    meta: [
      { title: "Directives — NYXIS" },
      { name: "description", content: "Active quests, proof submissions, and evaluation progress." },
    ],
  }),
  component: DirectivesPage,
});

function DirectivesPage() {
  const [quests, setQuests] = useState<Quest[]>(seedQuests);
  const [proofFor, setProofFor] = useState<Quest | null>(null);
  const [goal, setGoal] = useState("Ship NYXIS v1 by end of quarter without losing physical baseline");
  const [generating, setGenerating] = useState(false);

  const active = quests.filter((q) => q.status === "ACTIVE");
  const locked = quests.filter((q) => q.status === "LOCKED");

  function abort(q: Quest) {
    setQuests((qs) => qs.filter((x) => x.id !== q.id));
  }

  function generate() {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1400);
  }

  return (
    <AppShell title="Directives / Quests" subtitle="The main loop: define, generate, complete, prove">
      {/* Pressure (compact, reused for context) */}
      <section className="mb-6">
        <PressureMeter value={hunter.pressure} />
      </section>

      {/* Objective + generate */}
      <section className="mb-8">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">Objective</h3>
            <p className="text-[11px] text-muted-foreground">What should the next directives push you toward?</p>
          </div>
        </div>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-sm border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-neon-cyan"
        />
        <button
          onClick={generate}
          disabled={generating}
          className="group mt-3 flex w-full items-center justify-between rounded-sm border border-neon-gold/40 bg-neon-gold/10 px-4 py-3 text-neon-gold hover:bg-neon-gold/20 disabled:opacity-60"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="size-4" />
            <span className="text-left">
              <span className="block font-mono text-[11px] font-bold uppercase tracking-widest">
                Commune with Architect
              </span>
              <span className="block text-[11px] font-normal normal-case tracking-normal text-muted-foreground">
                Generate quest path
              </span>
            </span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest">
            {generating ? "Pathing…" : "Initiate →"}
          </span>
        </button>
      </section>

      {/* Active quests */}
      <section className="mb-8">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">
              Active Directives
            </h3>
            <p className="text-[11px] text-muted-foreground">{active.length} live · scan and submit evidence</p>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-neon-cyan">
            <Target className="size-3" />
            Next eval in 6h 22m
          </div>
        </div>

        <div className="space-y-2">
          {active.map((q) => (
            <QuestCard key={q.id} quest={q} onSubmit={setProofFor} onAbort={abort} />
          ))}
        </div>

        {/* Next evaluation progress */}
        <div className="mt-4 rounded-sm border border-border bg-surface/40 p-3">
          <div className="mb-1 flex items-end justify-between font-mono text-[10px] uppercase tracking-widest">
            <span className="text-muted-foreground">Next evaluation progress</span>
            <span className="text-neon-cyan">{Math.round((active.filter(q => false).length / (active.length || 1)) * 0 + 38)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-sm bg-border">
            <div className="h-full bg-neon-cyan glow-cyan" style={{ width: "38%" }} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Complete the rest of today's directives before the next Architect evaluation to avoid pressure escalation.
          </p>
        </div>
      </section>

      {/* Locked queue */}
      {locked.length > 0 && (
        <section className="mb-8">
          <div className="mb-3">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">
              Locked Queue
            </h3>
            <p className="text-[11px] text-muted-foreground">Unlocks as prerequisites are cleared</p>
          </div>
          <div className="space-y-2">
            {locked.map((q) => (
              <QuestCard key={q.id} quest={q} />
            ))}
          </div>
        </section>
      )}

      {/* Behavior profile */}
      <section className="mb-8">
        <div className="mb-2">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">
            Behavior Profile
          </h3>
          <p className="text-[11px] text-muted-foreground">How the system sees your recent patterns</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["consistency", "avoidance", "intensity"] as const).map((key) => {
            const v = behaviorProfile[key];
            const accent = key === "avoidance" ? (v > 50 ? "text-neon-red" : "text-neon-gold") : "text-neon-cyan";
            const bar = key === "avoidance" ? (v > 50 ? "bg-neon-red" : "bg-neon-gold") : "bg-neon-cyan";
            return (
              <div key={key} className="rounded-sm border border-border bg-surface/40 p-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{key}</p>
                <p className={`mt-1 font-mono text-lg ${accent}`}>{v}%</p>
                <div className="mt-2 h-0.5 overflow-hidden bg-border">
                  <div className={`h-full ${bar}`} style={{ width: `${v}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Architect message */}
      <section>
        <div className="rounded-sm border border-neon-gold/20 bg-neon-gold/5 p-4">
          <div className="flex items-center gap-2">
            <span className="size-1.5 animate-pulse-glow rounded-full bg-neon-gold" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-neon-gold">Architect note</span>
          </div>
          <p className="mt-2 border-l border-neon-gold/30 pl-3 font-mono text-[12px] leading-relaxed text-foreground/90">
            {architectMessage}
          </p>
        </div>
      </section>

      {proofFor && <ProofModal quest={proofFor} onClose={() => setProofFor(null)} />}
    </AppShell>
  );
}
