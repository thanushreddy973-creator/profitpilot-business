import { createFileRoute, Link } from "@tanstack/react-router";
import { cashSummary, stockStatus } from "@/lib/analysis";
import { formatMoney } from "@/lib/currencies";
import { useProducts, useProfile, useTransactions, useGroceryItems } from "@/lib/data";
import { Chip, EmptyState, SectionHeader, Stat } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ProfitPilot" },
      { name: "description", content: "Your stock health and cash position at a glance." },
      { property: "og:title", content: "Dashboard — ProfitPilot" },
      { property: "og:description", content: "Stock health and cash position at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: products = [] } = useProducts();
  const { data: transactions = [] } = useTransactions();
  const { data: grocery = [] } = useGroceryItems();
  const code = profile?.currency_code ?? "USD";
  const s = cashSummary(transactions, products, profile);
  const low = products.filter((p) => ["low", "out"].includes(stockStatus(p, profile)));
  const over = products.filter((p) => stockStatus(p, profile) === "overstock");
  const toBuy = grocery.filter((g) => !g.is_purchased);

  const empty = products.length === 0 && transactions.length === 0;

  return (
    <div>
      <SectionHeader
        title={profile?.business_name ?? "Dashboard"}
        description="Every figure here is calculated from the products and transactions you entered."
      />

      {empty ? (
        <EmptyState
          title="Nothing recorded yet"
          body="Add your first product or transaction and this dashboard fills itself in."
          action={
            <div className="flex gap-2">
              <Link to="/inventory" className="btn">
                Add a product
              </Link>
              <Link to="/cash-flow" className="btn-ghost">
                Add a transaction
              </Link>
            </div>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Cash balance" value={formatMoney(s.balance, code)} tone="accent" wide />
            <Stat label="Revenue" value={formatMoney(s.income, code)} tone="ok" />
            <Stat label="Expenses" value={formatMoney(s.expenses, code)} tone="danger" />
            <Stat
              label="Estimated profit"
              value={formatMoney(s.profit, code)}
              tone={s.profit >= 0 ? "ok" : "danger"}
            />
            <Stat label="Upcoming out" value={formatMoney(s.upcomingExpenses, code)} tone="warn" />
            <Stat label="Stock value" value={formatMoney(s.inventoryValue, code)} />
            <Stat label="Potential revenue" value={formatMoney(s.potentialRevenue, code)} />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="panel p-4">
              <div className="label-mono">Cash-flow risk</div>
              <div className="mt-2 flex items-center gap-2">
                <Chip
                  tone={
                    s.risk === "High"
                      ? "danger"
                      : s.risk === "Moderate"
                        ? "warn"
                        : s.risk === "Low"
                          ? "ok"
                          : "muted"
                  }
                >
                  {s.risk.toUpperCase()}
                </Chip>
              </div>
              <p className="mt-2 text-[13px] text-muted-foreground">{s.riskReason}</p>
            </div>
            <div className="panel p-4">
              <div className="label-mono">Needs restocking</div>
              <div className="num mt-1.5 text-[22px] font-semibold text-danger">{low.length}</div>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {low.length ? low.slice(0, 3).map((p) => p.name).join(", ") : "No products are low."}
              </p>
              <Link to="/smart-stock" className="mt-3 inline-flex text-[12px] text-accent">
                Open Smart Stock →
              </Link>
            </div>
            <div className="panel p-4">
              <div className="label-mono">Overstocked · To buy</div>
              <div className="num mt-1.5 text-[22px] font-semibold text-warn">
                {over.length} · {toBuy.length}
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {toBuy.length
                  ? `${toBuy.length} item(s) still on your grocery list.`
                  : "Your grocery list is clear."}
              </p>
              <Link to="/grocery" className="mt-3 inline-flex text-[12px] text-accent">
                Open grocery list →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
