import { ArrowRight, Lock, ShieldAlert, Upload, X } from "lucide-react";
import type { Quest, ProofType } from "@/lib/mock-data";

const typeColor: Record<Quest["type"], string> = {
  DAILY: "text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10",
  SIDE: "text-neon-gold border-neon-gold/30 bg-neon-gold/10",
  RANK_UP: "text-neon-purple border-neon-purple/40 bg-neon-purple/10",
  EMERGENCY: "text-neon-red border-neon-red/40 bg-neon-red/10",
};

const typeLabel: Record<Quest["type"], string> = {
  DAILY: "Daily directive",
  SIDE: "Side directive",
  RANK_UP: "Rank-up trial",
  EMERGENCY: "Emergency",
};

const proofLabel: Record<ProofType, string> = {
  GITHUB: "GitHub commit",
  FITBIT: "Wearable trace",
  PHOTO: "Photo evidence",
  URL: "Shareable URL",
  TEXT: "Text log",
};

export function QuestCard({
  quest,
  onSubmit,
  onAbort,
}: {
  quest: Quest;
  onSubmit?: (q: Quest) => void;
  onAbort?: (q: Quest) => void;
}) {
  const locked = quest.status === "LOCKED";
  return (
    <div
      className={`group relative overflow-hidden border-l-2 ${
        locked ? "border-border bg-surface/30 opacity-70" : "border-neon-cyan bg-surface/60 hover:bg-surface"
      } p-4 transition-colors`}
    >
      {!locked && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-neon-cyan glow-cyan" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className={`rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${typeColor[quest.type]}`}>
              {quest.type.replace("_", " ")}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">{typeLabel[quest.type]}</span>
          </div>
          <h4 className="text-sm font-semibold tracking-tight text-foreground">{quest.title}</h4>
          <p className="text-[12px] leading-snug text-muted-foreground">{quest.subtitle}</p>
        </div>

        <div className="text-right">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`block h-3 w-1 ${
                  i < quest.difficulty ? "bg-neon-magenta" : "bg-border"
                }`}
              />
            ))}
          </div>
          <span className="mt-1 block font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            DIF {quest.difficulty}/5
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-3 font-mono text-[10px] uppercase tracking-widest">
        <span className="text-neon-cyan">+{quest.xp} XP</span>
        <span className="text-muted-foreground">
          Stat <span className="text-foreground">{quest.statFocus}</span>
        </span>
        <span className="text-muted-foreground">
          Proof <span className="rounded-sm border border-neon-gold/30 bg-neon-gold/10 px-1 text-neon-gold">{quest.proof}</span>
          <span className="ml-1 normal-case tracking-normal text-muted-foreground">{proofLabel[quest.proof]}</span>
        </span>
      </div>

      {locked ? (
        <div className="mt-3 flex items-center gap-2 rounded-sm border border-dashed border-border bg-background/40 px-2 py-1.5">
          <Lock className="size-3 text-muted-foreground" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Locked until: <span className="text-foreground/80 normal-case tracking-normal">{quest.lockedBy}</span>
          </span>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onSubmit?.(quest)}
            className="flex flex-1 items-center justify-between rounded-sm bg-neon-cyan px-3 py-2.5 text-primary-foreground transition-transform hover:brightness-110 active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <Upload className="size-3.5" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest">Submit Proof</span>
            </span>
            <ArrowRight className="size-3.5" />
          </button>
          <button
            onClick={() => onAbort?.(quest)}
            title="Abort directive"
            className="flex items-center gap-1 rounded-sm border border-neon-red/30 bg-background px-3 py-2.5 font-mono text-[11px] uppercase tracking-widest text-neon-red hover:bg-neon-red/10"
          >
            <X className="size-3.5" />
            Abort
          </button>
        </div>
      )}

      {quest.type === "RANK_UP" && !locked && (
        <div className="mt-2 flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-neon-purple">
          <ShieldAlert className="size-3" />
          Boss gate — proof reviewed by Architect personally
        </div>
      )}
    </div>
  );
}
