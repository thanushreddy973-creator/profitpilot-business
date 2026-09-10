import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  recommendation,
  STOCK_LABEL,
  STOCK_TONE,
  stockStatus,
  type Recommendation,
} from "@/lib/analysis";
import { formatMoney } from "@/lib/currencies";
import { useProducts, useProfile } from "@/lib/data";
import { EmptyState, SectionHeader, Stat } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/smart-stock")({
  head: () => ({
    meta: [
      { title: "Smart Stock — ProfitPilot" },
      { name: "description", content: "See which products need reordering, which are overstocked and why." },
      { property: "og:title", content: "Smart Stock — ProfitPilot" },
      { property: "og:description", content: "Reorder, reduce, monitor or leave alone — with reasons." },
    ],
  }),
  component: SmartStock,
});

const ACTIONS: Recommendation[] = ["Reorder", "Reduce purchasing", "Monitor", "Healthy stock"];

function SmartStock() {
  const { data: profile } = useProfile();
  const { data: products = [] } = useProducts();
  const code = profile?.currency_code ?? "USD";
  const [action, setAction] = useState<"all" | Recommendation>("all");

  const analysed = products.map((p) => ({ product: p, ...recommendation(p, profile) }));
  const counts = ACTIONS.map((a) => ({ a, n: analysed.filter((x) => x.action === a).length }));
  const rows = analysed.filter((x) => action === "all" || x.action === action);

  return (
    <div>
      <SectionHeader
        title="Smart Stock"
        description="A read on every product's stock level, with a plain reason for each recommendation."
      />

      {products.length === 0 ? (
        <EmptyState
          title="No products to analyse"
          body="Add products in Inventory and this page will grade every one of them."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {counts.map(({ a, n }) => (
              <Stat
                key={a}
                label={a}
                value={String(n)}
                tone={a === "Reorder" ? "danger" : a === "Reduce purchasing" ? "warn" : a === "Monitor" ? "accent" : "ok"}
              />
            ))}
          </div>

          <div className="mt-4 mb-3 flex flex-wrap gap-2">
            <button className={action === "all" ? "btn" : "btn-ghost"} onClick={() => setAction("all")}>
              All
            </button>
            {ACTIONS.map((a) => (
              <button
                key={a}
                className={action === a ? "btn" : "btn-ghost"}
                onClick={() => setAction(a)}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="grid gap-2.5">
            {rows.map(({ product, action: act, reason }) => {
              const st = stockStatus(product, profile);
              return (
                <div key={product.id} className="panel p-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold">{product.name}</span>
                    <span className={`num rounded-md px-2 py-0.5 text-[10px] ${STOCK_TONE[st]}`}>
                      {STOCK_LABEL[st]}
                    </span>
                    <span className="num rounded-md bg-accent/12 px-2 py-0.5 text-[10px] text-accent">
                      {act.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">{reason}</p>
                  <div className="num mt-1.5 text-[11px] text-faint">
                    Stock value {formatMoney(Number(product.quantity) * Number(product.cost_price), code)}
                  </div>
                </div>
              );
            })}
            {rows.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Nothing in this group.</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
