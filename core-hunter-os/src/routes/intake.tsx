import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "Hunter Calibration — NYXIS" },
      { name: "description", content: "Calibrate your NYXIS profile: aim, conditions, constraints, intensity." },
    ],
  }),
  component: IntakePage,
});

const steps = ["AIM", "CONDITIONS", "CONSTRAINTS", "TIME", "INTENSITY"] as const;
const stepCopy: Record<(typeof steps)[number], { label: string; sub: string }> = {
  AIM:         { label: "Primary Aim",       sub: "What are you trying to become?" },
  CONDITIONS:  { label: "Current Conditions", sub: "Where do you actually stand right now?" },
  CONSTRAINTS: { label: "Constraints",        sub: "What's blocking you that the system should respect?" },
  TIME:        { label: "Available Time",     sub: "How many hours can you put against this each week?" },
  INTENSITY:   { label: "Preferred Intensity", sub: "How hard should the Architect push you?" },
};

const intensities = [
  { id: "TEMPERED",  label: "Tempered",  desc: "Steady, sustainable. Build the habit first." },
  { id: "FORGED",    label: "Forged",    desc: "Push the line. Most Hunters live here." },
  { id: "RELENTLESS",label: "Relentless",desc: "Trial conditions. Pressure escalates fast." },
];

export function IntakePage() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [time, setTime] = useState(8);
  const [intensity, setIntensity] = useState("FORGED");

  const current = steps[i];
  const isLast = i === steps.length - 1;

  function next() {
    if (isLast) navigate({ to: "/status" });
    else setI(i + 1);
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-8">
        {/* Header */}
        <header>
          <div className="flex items-center gap-2">
            <div className="size-2 animate-pulse-glow rounded-full bg-neon-cyan" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-neon-cyan">
              Calibration / {String(i + 1).padStart(2, "0")} of {String(steps.length).padStart(2, "0")}
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{stepCopy[current].label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{stepCopy[current].sub}</p>

          {/* Step rail */}
          <div className="mt-5 flex gap-1">
            {steps.map((s, idx) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-sm ${
                  idx < i ? "bg-neon-cyan" : idx === i ? "bg-neon-cyan glow-cyan" : "bg-border"
                }`}
              />
            ))}
          </div>
        </header>

        {/* Body */}
        <div className="mt-8 flex-1">
          {(current === "AIM" || current === "CONDITIONS" || current === "CONSTRAINTS") && (
            <textarea
              autoFocus
              rows={6}
              value={vals[current] ?? ""}
              onChange={(e) => setVals({ ...vals, [current]: e.target.value })}
              placeholder={
                current === "AIM"
                  ? "Ship NYXIS v1 and run a sub-1:40 half-marathon by Q3."
                  : current === "CONDITIONS"
                  ? "Solo founder. 3 hrs/day. Running 25km/week. Sleep is unstable."
                  : "No gym access after 9pm. Travel 4 days in November. Recurring shoulder issue."
              }
              className="w-full resize-none rounded-sm border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-neon-cyan"
            />
          )}

          {current === "TIME" && (
            <div>
              <div className="mb-4 rounded-sm border border-border bg-surface px-4 py-6 text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Hours per week</p>
                <p className="mt-1 font-mono text-5xl font-bold text-neon-cyan text-glow-cyan">{time}</p>
              </div>
              <input
                type="range"
                min={2}
                max={40}
                step={1}
                value={time}
                onChange={(e) => setTime(parseInt(e.target.value, 10))}
                className="w-full accent-neon-cyan"
              />
              <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>2h</span><span>20h</span><span>40h</span>
              </div>
            </div>
          )}

          {current === "INTENSITY" && (
            <div className="space-y-2">
              {intensities.map((opt) => {
                const active = intensity === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setIntensity(opt.id)}
                    className={`flex w-full items-start gap-3 border-l-2 p-4 text-left transition-colors ${
                      active ? "border-neon-cyan bg-neon-cyan/5" : "border-border bg-surface/40 hover:bg-surface"
                    }`}
                  >
                    <div className={`mt-0.5 flex size-5 items-center justify-center rounded-sm border ${active ? "border-neon-cyan bg-neon-cyan text-primary-foreground" : "border-border"}`}>
                      {active && <Check className="size-3" />}
                    </div>
                    <div>
                      <p className={`font-mono text-[11px] font-semibold uppercase tracking-widest ${active ? "text-neon-cyan" : "text-foreground"}`}>
                        {opt.label}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Always-visible proof notice */}
          <div className="mt-6 rounded-sm border border-neon-gold/20 bg-neon-gold/5 p-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-neon-gold">
              Proof is assigned by NYXIS
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Code work may require GitHub commits. Fitness may require traceable metrics or photo evidence.
              The system chooses the strictest suitable proof for each directive.
            </p>
          </div>
        </div>

        {/* Footer / actions */}
        <div className="mt-6 flex gap-2">
          {i > 0 && (
            <button
              onClick={() => setI(i - 1)}
              className="rounded-sm border border-border px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
          )}
          <button
            onClick={next}
            className="group flex flex-1 items-center justify-between rounded-sm bg-neon-cyan px-4 py-3 text-primary-foreground hover:brightness-110"
          >
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
              {isLast ? "Initialize system" : "Continue calibration"}
            </span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
