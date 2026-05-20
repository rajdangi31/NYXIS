import { useMemo, useState } from "react";
import { X, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Quest, ProofType } from "@/lib/mock-data";

const proofFields: Record<ProofType, { label: string; placeholder: string; mono?: boolean }[]> = {
  GITHUB: [
    { label: "Repository URL", placeholder: "https://github.com/you/repo", mono: true },
    { label: "Commit or PR URL", placeholder: "https://github.com/you/repo/commit/…", mono: true },
    { label: "Summary of the code change", placeholder: "What did you actually ship?" },
    { label: "Measurable result", placeholder: "Tests added, perf delta, bug closed, etc." },
  ],
  FITBIT: [
    { label: "Activity / metric", placeholder: "Zone 3 run / steady cardio" },
    { label: "Duration & distance", placeholder: "45 min · 7.2 km" },
    { label: "Heart-rate zone or pace", placeholder: "Avg HR 152 bpm · Zone 3" },
    { label: "Device or source reference", placeholder: "Fitbit Charge 6 · export ID" },
  ],
  PHOTO: [
    { label: "Photo reference", placeholder: "Upload reference or image URL", mono: true },
    { label: "Timestamp & context", placeholder: "Today, 06:42 — home gym, set 5/5" },
    { label: "Measurable result", placeholder: "Weight × reps × RPE, or concrete output" },
  ],
  URL: [
    { label: "Shareable artifact URL", placeholder: "https://…", mono: true },
    { label: "Why this counts as proof", placeholder: "Explain what the link shows" },
  ],
  TEXT: [
    { label: "Concrete details", placeholder: "What did you do? Be specific." },
    { label: "Measurable result", placeholder: "Numbers, outputs, before/after" },
  ],
};

type Phase = "form" | "rejected" | "accepted";

export function ProofModal({
  quest,
  onClose,
}: {
  quest: Quest;
  onClose: () => void;
}) {
  const fields = proofFields[quest.proof];
  const [values, setValues] = useState<string[]>(() => fields.map(() => ""));
  const [confidence, setConfidence] = useState(60);
  const [summary, setSummary] = useState("");
  const [reality, setReality] = useState("");
  const [phase, setPhase] = useState<Phase>("form");

  const strength = useMemo(() => {
    const filled = values.filter((v) => v.trim().length > 6).length;
    const text = (summary.length > 20 ? 20 : summary.length) + (reality.length > 30 ? 30 : reality.length);
    const base = (filled / fields.length) * 60 + text + Math.round(confidence * 0.1);
    return Math.max(4, Math.min(100, Math.round(base)));
  }, [values, summary, reality, confidence, fields.length]);

  const strengthColor = strength >= 75 ? "text-neon-green" : strength >= 50 ? "text-neon-cyan" : strength >= 30 ? "text-neon-gold" : "text-neon-red";
  const strengthBar = strength >= 75 ? "bg-neon-green" : strength >= 50 ? "bg-neon-cyan" : strength >= 30 ? "bg-neon-gold" : "bg-neon-red";

  function submit() {
    setPhase(strength >= 60 ? "accepted" : "rejected");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/85 backdrop-blur-md sm:items-center">
      <div className="relative w-full max-w-md border-t-2 border-neon-cyan bg-surface shadow-2xl sm:rounded-sm sm:border">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon-cyan">Proof Review</p>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">{quest.title}</h2>
            <p className="text-[11px] text-muted-foreground">
              Required: <span className="text-neon-gold">{quest.proof}</span> · Submit evidence
            </p>
          </div>
          <button onClick={onClose} className="rounded-sm border border-border p-1 text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        {phase === "form" && (
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
            <div className="mb-3 rounded-sm border border-neon-gold/20 bg-neon-gold/5 p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-neon-gold">Proof is assigned by NYXIS</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                You can't downgrade the requirement. Code work requires commits. Fitness requires traceable metrics or photo evidence. The system picks the strictest suitable proof.
              </p>
            </div>

            <Field label="What did you complete?" sub="Plain language. One sentence.">
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-neon-cyan"
                placeholder="I completed a 90-minute uninterrupted deep work block on the auth flow."
              />
            </Field>

            {fields.map((f, i) => (
              <Field key={i} label={f.label} sub="Evidence required">
                <input
                  value={values[i]}
                  onChange={(e) => {
                    const next = [...values];
                    next[i] = e.target.value;
                    setValues(next);
                  }}
                  placeholder={f.placeholder}
                  className={`w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-neon-cyan ${
                    f.mono ? "font-mono text-[12px]" : ""
                  }`}
                />
              </Field>
            ))}

            <Field label="What made it real?" sub="The detail only someone who actually did it would know.">
              <textarea
                value={reality}
                onChange={(e) => setReality(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-neon-cyan"
                placeholder="The third set failed at rep 4. I racked it, breathed, and finished clean."
              />
            </Field>

            <Field label={`Confidence — ${confidence}%`} sub="How real does this submission feel to you?">
              <input
                type="range"
                min={0}
                max={100}
                value={confidence}
                onChange={(e) => setConfidence(parseInt(e.target.value, 10))}
                className="w-full accent-neon-cyan"
              />
            </Field>

            <div className="sticky bottom-0 -mx-5 mt-2 border-t border-border bg-surface px-5 pb-4 pt-3">
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Evidence Strength</p>
                  <p className="text-[11px] text-muted-foreground">Updates as you write</p>
                </div>
                <span className={`font-mono text-lg font-semibold ${strengthColor}`}>{strength}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-sm bg-border">
                <div className={`h-full transition-all ${strengthBar}`} style={{ width: `${strength}%` }} />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={submit}
                  className="flex-1 rounded-sm bg-neon-cyan py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground hover:brightness-110"
                >
                  Seal & Submit
                </button>
                <button
                  onClick={onClose}
                  className="rounded-sm border border-border px-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "rejected" && (
          <div className="px-5 py-6">
            <div className="mb-4 flex items-center gap-2 text-neon-red">
              <AlertTriangle className="size-5" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Proof Rejected</h3>
            </div>
            <p className="text-sm text-foreground">Score: <span className={`font-mono ${strengthColor}`}>{strength} / 100</span></p>
            <div className="mt-3 space-y-2 rounded-sm border border-neon-red/30 bg-neon-red/5 p-3 text-[12px] text-muted-foreground">
              <p><span className="font-mono text-[10px] uppercase tracking-widest text-neon-red">Reason</span><br />The Architect couldn't verify the work from the evidence provided.</p>
              <p><span className="font-mono text-[10px] uppercase tracking-widest text-neon-red">Missing</span><br />Specific measurable result. Concrete artifact link or trace.</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setPhase("form")} className="flex-1 rounded-sm border border-neon-cyan/40 bg-neon-cyan/10 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-neon-cyan hover:bg-neon-cyan/20">
                Revise & submit again
              </button>
              <button onClick={onClose} className="rounded-sm border border-border px-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Later
              </button>
            </div>
          </div>
        )}

        {phase === "accepted" && (
          <div className="px-5 py-6">
            <div className="mb-4 flex items-center gap-2 text-neon-green">
              <CheckCircle2 className="size-5" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Proof Accepted</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] uppercase tracking-widest">
              <Metric label="Score" value={`${strength}`} accent="text-neon-green" />
              <Metric label="XP awarded" value={`+${quest.xp}`} accent="text-neon-cyan" />
              <Metric label="Pressure" value="−8%" accent="text-neon-green" />
              <Metric label={`${quest.statFocus} stat`} value="+1" accent="text-neon-gold" />
            </div>
            <button onClick={onClose} className="mt-5 w-full rounded-sm bg-neon-cyan py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground hover:brightness-110">
              Return to directives
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground">{sub}</span>
      </div>
      {children}
    </label>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-sm border border-border bg-background/40 p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-lg ${accent}`}>{value}</p>
    </div>
  );
}
