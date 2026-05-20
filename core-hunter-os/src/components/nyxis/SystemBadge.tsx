import type { SystemState } from "@/lib/mock-data";

const map: Record<SystemState, { color: string; bg: string; border: string; label: string }> = {
  NORMAL:           { color: "text-neon-green",   bg: "bg-neon-green/10",   border: "border-neon-green/30",   label: "Stable" },
  FOCUSED:          { color: "text-neon-cyan",    bg: "bg-neon-cyan/10",    border: "border-neon-cyan/30",    label: "In flow" },
  PRESSURED:        { color: "text-neon-gold",    bg: "bg-neon-gold/10",    border: "border-neon-gold/30",    label: "Strain rising" },
  PENALTY:          { color: "text-neon-magenta", bg: "bg-neon-magenta/10", border: "border-neon-magenta/30", label: "Penalty active" },
  TRIAL:            { color: "text-neon-purple",  bg: "bg-neon-purple/10",  border: "border-neon-purple/30",  label: "Trial open" },
  SYSTEM_COLLAPSE:  { color: "text-neon-red",     bg: "bg-neon-red/10",     border: "border-neon-red/40",     label: "Collapse" },
};

export function SystemBadge({ state }: { state: SystemState }) {
  const m = map[state];
  return (
    <div className={`inline-flex items-center gap-2 rounded-sm border ${m.border} ${m.bg} px-2 py-1`}>
      <span className={`size-1.5 rounded-full ${m.color.replace("text-", "bg-")} animate-pulse-glow`} />
      <span className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${m.color}`}>{state}</span>
      <span className="font-mono text-[10px] text-muted-foreground normal-case tracking-normal">{m.label}</span>
    </div>
  );
}
