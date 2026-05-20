import { Link } from "@tanstack/react-router";
import { LogOut, RefreshCw } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { SystemBadge } from "./SystemBadge";
import { hunter } from "@/lib/mock-data";

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col border-x border-border/60">
        {/* Top system bar */}
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 px-5 pb-3 pt-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-neon-cyan glow-cyan animate-pulse-glow" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-neon-cyan">
                NYXIS / v4.02
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                title="Sync with Architect"
                className="rounded-sm border border-border p-1.5 text-muted-foreground hover:border-neon-cyan/40 hover:text-neon-cyan"
              >
                <RefreshCw className="size-3.5" />
              </button>
              <Link
                to="/login"
                title="Sign out"
                className="rounded-sm border border-border p-1.5 text-muted-foreground hover:border-neon-red/40 hover:text-neon-red"
              >
                <LogOut className="size-3.5" />
              </Link>
            </div>
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div>
              <h1 className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-foreground">
                {title}
              </h1>
              <p className="text-[12px] text-muted-foreground">{subtitle}</p>
            </div>
            <SystemBadge state={hunter.state} />
          </div>
        </header>

        <main className="flex-1 px-5 pb-32 pt-6">{children}</main>

        <BottomNav />
      </div>
    </div>
  );
}
