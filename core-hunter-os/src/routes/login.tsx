import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "System Uplink — NYXIS" },
      { name: "description", content: "Sign in to your NYXIS Hunter account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handle(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: mode === "register" ? "/intake" : "/status" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-neon-cyan/5 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neon-magenta/5 to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-6 py-10">
        {/* System header */}
        <header>
          <div className="flex items-center gap-2">
            <div className="size-2 animate-pulse-glow rounded-full bg-neon-cyan glow-cyan" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-neon-cyan">
              NYXIS / Uplink terminal
            </span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
            System Uplink
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your Hunter profile, or register to begin calibration.
          </p>
        </header>

        {/* Form */}
        <form onSubmit={handle} className="my-8 space-y-4">
          <div className="flex rounded-sm border border-border bg-surface/60 p-1">
            {(["signin", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-sm py-2 font-mono text-[11px] font-semibold uppercase tracking-widest transition-colors ${
                  mode === m ? "bg-neon-cyan text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-foreground">
              Email
              <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-muted-foreground">Used as your handle</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hunter@nyxis.dev"
              className="w-full rounded-sm border border-border bg-surface px-3 py-3 font-mono text-sm outline-none focus:border-neon-cyan"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-foreground">
              Pass-key
              <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-muted-foreground">Minimum 8 characters</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-sm border border-border bg-surface px-3 py-3 font-mono text-sm outline-none focus:border-neon-cyan"
            />
          </div>

          <button
            type="submit"
            className="group flex w-full items-center justify-between rounded-sm bg-neon-cyan px-4 py-3.5 text-primary-foreground transition-transform hover:brightness-110 active:scale-[0.99]"
          >
            <span className="font-mono text-[12px] font-bold uppercase tracking-widest">
              {mode === "signin" ? "Establish uplink" : "Begin calibration"}
            </span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </button>

          <Link to="/status" className="block text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-neon-cyan">
            Demo · Skip uplink →
          </Link>
        </form>

        <footer className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          By signing in, you agree NYXIS may audit your proof of work.
        </footer>
      </div>
    </div>
  );
}
