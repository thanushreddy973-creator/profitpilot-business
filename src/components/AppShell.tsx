import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  Boxes,
  Brain,
  Gauge,
  ListChecks,
  LogOut,
  Radar,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Store,
  Layers,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/data";
import { cn } from "@/lib/utils";

export const NAV = [
  { to: "/dashboard", label: "Dashboard", short: "Home", icon: Gauge },
  { to: "/inventory", label: "Inventory", short: "Stock", icon: Boxes },
  { to: "/grocery", label: "Grocery List", short: "Grocery", icon: ListChecks },
  { to: "/suppliers", label: "Sellers", short: "Sellers", icon: Store },
  { to: "/cash-flow", label: "Cash Flow Radar", short: "Cash", icon: Radar },
  { to: "/smart-stock", label: "Smart Stock", short: "Smart", icon: Layers },
  { to: "/ai-decisions", label: "AI Decisions", short: "AI", icon: Brain },
  { to: "/simulator", label: "What-If", short: "What-If", icon: SlidersHorizontal },
  { to: "/settings", label: "Settings", short: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (profile?.business_name ?? "PP")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-sidebar px-3 py-4 lg:flex">
        <div className="flex items-center gap-2.5 px-2">
          <div className="num grid size-7 place-items-center rounded-md bg-elevated text-[11px] font-semibold text-accent ring-1 ring-white/5">
            P
          </div>
          <div className="leading-none">
            <div className="text-[13px] font-semibold tracking-tight">ProfitPilot</div>
            <div className="num mt-1 text-[10px] text-faint">Operator workspace</div>
          </div>
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-0.5">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
              activeProps={{ className: "bg-elevated text-foreground" }}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={signOut}
          className="mt-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-elevated hover:text-danger"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </aside>

      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-line bg-background/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="num grid size-7 shrink-0 place-items-center rounded-md bg-elevated text-[11px] font-semibold text-accent ring-1 ring-white/5 lg:hidden">
                P
              </div>
              <div className="min-w-0 leading-none">
                <div className="truncate text-[13px] font-semibold tracking-tight">
                  {profile?.business_name ?? "ProfitPilot"}
                </div>
                <div className="num mt-1 text-[10px] text-faint">
                  {profile ? `Currency · ${profile.currency_code}` : "Loading…"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={signOut}
                className="rounded-md bg-elevated px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground ring-1 ring-white/5 transition-colors hover:text-danger lg:hidden"
              >
                Sign out
              </button>
              <div className="num grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-accent/40 to-elevated text-[11px] font-semibold ring-1 ring-white/10">
                {initials || "PP"}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 lg:pb-10">{children}</main>
      </div>

      {/* Mobile / tablet bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 px-1.5 py-2 backdrop-blur lg:hidden">
        <div className="flex justify-between overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-w-[46px] flex-col items-center gap-1 py-1 text-faint transition-colors",
              )}
              activeProps={{ className: "text-accent" }}
            >
              <item.icon className="size-[15px]" />
              <span className="text-[9px] font-medium">{item.short}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
