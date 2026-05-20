export function StatGrid({ stats }: { stats: { STR: number; INT: number; DEX: number; VIT: number; WIS: number } }) {
  const entries = Object.entries(stats) as Array<[keyof typeof stats, number]>;
  const max = Math.max(...entries.map(([, v]) => v));
  return (
    <div className="grid grid-cols-5 gap-2">
      {entries.map(([k, v]) => {
        const isTop = v === max;
        return (
          <div
            key={k}
            className={`flex flex-col items-center rounded-sm border p-2 ${
              isTop ? "border-neon-cyan/30 bg-neon-cyan/5" : "border-border bg-surface/40"
            }`}
          >
            <span className={`font-mono text-[10px] uppercase tracking-widest ${isTop ? "text-neon-cyan" : "text-muted-foreground"}`}>{k}</span>
            <span className="font-mono text-lg font-semibold text-foreground">{v}</span>
            <div className="mt-1 h-0.5 w-full overflow-hidden bg-border">
              <div
                className={isTop ? "h-full bg-neon-cyan glow-cyan" : "h-full bg-border-strong"}
                style={{ width: `${(v / 40) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
