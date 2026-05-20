import { Link, useLocation } from "@tanstack/react-router";
import { Activity, Crosshair, MessageSquareDashed, ShieldCheck, LifeBuoy } from "lucide-react";

const tabs = [
  { to: "/status",     label: "Status",     sub: "Identity",   Icon: Activity },
  { to: "/directives", label: "Directives", sub: "Quests",     Icon: Crosshair },
  { to: "/proof",      label: "Proof",      sub: "Evidence",   Icon: ShieldCheck },
  { to: "/architect",  label: "Architect",  sub: "Messages",   Icon: MessageSquareDashed },
  { to: "/recovery",   label: "Recovery",   sub: "Survival",   Icon: LifeBuoy },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[max(env(safe-area-inset-bottom),12px)] pt-2">
        {tabs.map(({ to, label, sub, Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className="group flex flex-1 flex-col items-center gap-0.5 px-1 py-1"
            >
              <div
                className={`flex h-7 w-10 items-center justify-center rounded-sm border ${
                  active
                    ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan glow-cyan"
                    : "border-transparent text-muted-foreground group-hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
              </div>
              <span
                className={`font-mono text-[9px] font-semibold uppercase tracking-widest ${
                  active ? "text-neon-cyan" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
              <span className="text-[8px] leading-none text-muted-foreground/70">{sub}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
