import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/nyxis/AppShell";
import { ProofModal } from "@/components/nyxis/ProofModal";
import { quests } from "@/lib/mock-data";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Quest } from "@/lib/mock-data";

export const Route = createFileRoute("/proof")({
  head: () => ({
    meta: [
      { title: "Proof — NYXIS" },
      { name: "description", content: "Submit and review proof of work for active directives." },
    ],
  }),
  component: ProofPage,
});

const history = [
  { id: "h1", title: "MORNING STRIKE / RUN", outcome: "ACCEPTED" as const, score: 88, xp: 320, ago: "yesterday" },
  { id: "h2", title: "DEEP WORK BLOCK", outcome: "ACCEPTED" as const, score: 74, xp: 450, ago: "yesterday" },
  { id: "h3", title: "JOURNAL — WEEKLY REVIEW", outcome: "REJECTED" as const, score: 38, xp: 0, ago: "2d ago" },
];

function ProofPage() {
  const [open, setOpen] = useState<Quest | null>(null);
  const pending = quests.filter((q) => q.status === "ACTIVE");

  return (
    <AppShell title="Proof / Evidence" subtitle="Submit work the system can verify">
      {/* Pending */}
      <section className="mb-8">
        <div className="mb-3">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">
            Pending Submissions
          </h3>
          <p className="text-[11px] text-muted-foreground">Directives waiting on evidence</p>
        </div>
        <div className="space-y-2">
          {pending.map((q) => (
            <button
              key={q.id}
              onClick={() => setOpen(q)}
              className="flex w-full items-center justify-between border-l-2 border-neon-cyan bg-surface/60 p-3 text-left hover:bg-surface"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{q.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  Requires{" "}
                  <span className="rounded-sm border border-neon-gold/30 bg-neon-gold/10 px-1 font-mono text-neon-gold">
                    {q.proof}
                  </span>
                </p>
              </div>
              <Clock className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>

      {/* History */}
      <section>
        <div className="mb-3">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">
            Audit Log
          </h3>
          <p className="text-[11px] text-muted-foreground">Past proof submissions and their verdicts</p>
        </div>
        <div className="space-y-1">
          {history.map((h) => {
            const ok = h.outcome === "ACCEPTED";
            return (
              <div
                key={h.id}
                className={`flex items-center justify-between border-l-2 ${
                  ok ? "border-neon-green" : "border-neon-red"
                } bg-surface/40 p-3`}
              >
                <div className="flex items-center gap-3">
                  {ok ? (
                    <CheckCircle2 className="size-4 text-neon-green" />
                  ) : (
                    <XCircle className="size-4 text-neon-red" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">{h.title}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {h.outcome} · score {h.score} · {h.ago}
                    </p>
                  </div>
                </div>
                <span className={`font-mono text-sm ${ok ? "text-neon-cyan" : "text-muted-foreground"}`}>
                  {ok ? `+${h.xp}` : "—"} XP
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {open && <ProofModal quest={open} onClose={() => setOpen(null)} />}
    </AppShell>
  );
}
