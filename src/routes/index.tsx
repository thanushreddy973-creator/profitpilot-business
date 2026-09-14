import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProfitPilotLogo } from "@/components/ProfitPilotLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProfitPilot — Inventory & cash flow for small businesses" },
      {
        name: "description",
        content:
          "ProfitPilot tracks your stock, suppliers, purchases and cash flow in one place, with plain-language recommendations built from your own numbers.",
      },
      { property: "og:title", content: "ProfitPilot — Inventory & cash flow for small businesses" },
      {
        property: "og:description",
        content:
          "Track stock, suppliers, purchases and cash flow, and get plain-language recommendations from your own numbers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://profitpilot-business.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://profitpilot-business.lovable.app/" }],
  }),
  component: Landing,
});

const FEATURES = [
  {
    label: "INVENTORY",
    title: "Stock that tells you the truth",
    body: "Every product carries its cost, price, minimum level and supplier, and flags itself as low, healthy or overstocked.",
  },
  {
    label: "CASH FLOW RADAR",
    title: "Money in, money out",
    body: "Log income and expenses, watch the balance move, and see a risk reading built only from what you actually recorded.",
  },
  {
    label: "DECISIONS",
    title: "Advice in plain language",
    body: "Reorder, reduce purchasing, monitor or leave alone — each recommendation explains the numbers behind it.",
  },
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-line px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ProfitPilotLogo className="size-7 shrink-0 rounded-md" />
            <div className="leading-none">
              <div className="text-[13px] font-semibold tracking-tight">ProfitPilot</div>
              <div className="num mt-1 text-[10px] text-faint">Operator workspace</div>
            </div>
          </div>
          <Link
            to={signedIn ? "/dashboard" : "/auth"}
            className="rounded-lg bg-accent px-3.5 py-2 text-[12px] font-semibold text-accent-foreground"
          >
            {signedIn ? "Open workspace" : "Sign in"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-14">
        <p className="num text-[11px] tracking-[0.08em] text-faint uppercase">
          Inventory · Suppliers · Cash flow
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl leading-tight font-semibold tracking-tight md:text-4xl">
          Run the stock and the money side of your business from one dark, quiet workspace.
        </h1>
        <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
          ProfitPilot keeps products, purchase lists, sellers and transactions in one place. Every
          figure you see is calculated from the data you entered — nothing is invented.
        </p>
        <Link
          to={signedIn ? "/dashboard" : "/auth"}
          className="mt-7 inline-flex rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-foreground"
        >
          {signedIn ? "Open workspace" : "Create your workspace"}
        </Link>

        <section className="mt-14 grid gap-3 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.label} className="panel p-4">
              <div className="label-mono">{f.label}</div>
              <h2 className="mt-2 text-[15px] font-semibold tracking-tight">{f.title}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
