export function PressureMeter({ value, threshold = 85 }: { value: number; threshold?: number }) {
  const segments = 24;
  const filled = Math.round((value / 100) * segments);
  const danger = value >= 70;
  const fillColor = value >= threshold ? "bg-neon-red" : value >= 70 ? "bg-neon-magenta" : value >= 40 ? "bg-neon-gold" : "bg-neon-cyan";
  const glow = value >= threshold ? "glow-cyan" : "";

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">Shadow Pressure</h3>
          <p className="text-[11px] text-muted-foreground">Risk level — how close you are to system collapse</p>
        </div>
        <div className="text-right">
          <div className={`font-mono text-2xl font-semibold ${value >= 70 ? "text-neon-magenta" : "text-neon-cyan"}`}>
            {value}<span className="text-base text-muted-foreground">%</span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {value >= threshold ? "Critical" : value >= 70 ? "Elevated" : value >= 40 ? "Nominal" : "Low"}
          </p>
        </div>
      </div>

      <div className={`relative h-12 overflow-hidden rounded-sm border border-border bg-surface ${danger ? "animate-flicker" : ""}`}>
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="pointer-events-none absolute inset-x-0 h-6 animate-scanline bg-gradient-to-b from-transparent via-neon-cyan/10 to-transparent" />
        <div className="relative flex h-full items-center gap-[2px] px-2">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className={`h-7 flex-1 rounded-[1px] transition-all ${
                i < filled ? `${fillColor} ${i === filled - 1 ? glow : ""}` : "bg-border/40"
              }`}
            />
          ))}
          <div
            className="absolute bottom-0 top-0 w-px bg-neon-red/60"
            style={{ left: `calc(${threshold}% )` }}
            title="Collapse threshold"
          />
        </div>
      </div>
      <div className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        <span>0</span>
        <span className="text-neon-red/70">Collapse @ {threshold}</span>
        <span>100</span>
      </div>
    </div>
  );
}
