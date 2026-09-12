import { useCurrency, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { cashSummary, recommendation, stockStatus } from "@/lib/analysis";
import { formatMoney } from "@/lib/currencies";
import { useProducts, useProfile, useTransactions } from "@/lib/data";
import { generateInsights } from "@/lib/ai.functions";
import { EmptyState, SectionHeader } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/ai-decisions")({
  head: () => ({
    meta: [
      { title: "AI Decisions — ProfitPilot" },
      { name: "description", content: "Plain-language business advice generated from your own numbers." },
      { property: "og:title", content: "AI Decisions — ProfitPilot" },
      { property: "og:description", content: "Advice built only from the data you recorded." },
    ],
  }),
  component: AIDecisions,
});

function AIDecisions() {
  const { data: profile } = useProfile();
  const { data: products = [] } = useProducts();
  const { data: transactions = [] } = useTransactions();
  const code = useCurrency();
  const s = cashSummary(transactions, products, profile);
  const run = useServerFn(generateInsights);

  const ai = useMutation({
    mutationFn: async () =>
      run({
        data: {
          currency: code,
          balance: s.balance,
          income: s.income,
          expenses: s.expenses,
          upcomingExpenses: s.upcomingExpenses,
          inventoryValue: s.inventoryValue,
          transactionCount: transactions.length,
          products: products.slice(0, 60).map((p) => ({
            name: p.name,
            quantity: Number(p.quantity),
            minStock: Number(p.min_stock),
            costPrice: Number(p.cost_price),
            sellingPrice: Number(p.selling_price),
            status: stockStatus(p, profile),
          })),
        },
      }),
  });

  const hasData = products.length > 0 || transactions.length > 0;

  const facts = products
    .map((p) => ({ p, ...recommendation(p, profile) }))
    .filter((x) => x.action !== "Healthy stock")
    .slice(0, 8);

  return (
    <div>
      <SectionHeader
        title="AI Decisions"
        description="Recommendations are built only from the products and transactions you recorded."
        action={
          hasData ? (
            <button className="btn" onClick={() => ai.mutate()} disabled={ai.isPending}>
              {ai.isPending ? "Analysing…" : "Analyse my business"}
            </button>
          ) : undefined
        }
      />

      {!hasData ? (
        <EmptyState
          title="There is nothing to analyse yet"
          body="Add products and transactions first. Until then there is no data to base any advice on."
        />
      ) : (
        <div className="grid gap-3">
          <div className="panel p-4">
            <div className="label-mono">What your numbers say</div>
            <ul className="mt-2 space-y-1.5 text-[13px] text-muted-foreground">
              <li>
                Cash balance {formatMoney(s.balance, code)} from {transactions.length} recorded
                transaction(s); risk reading {s.risk.toLowerCase()} — {s.riskReason}
              </li>
              <li>
                Stock at cost {formatMoney(s.inventoryValue, code)} across {products.length} product(s),
                potentially worth {formatMoney(s.potentialRevenue, code)} in sales.
              </li>
              {facts.map((f) => (
                <li key={f.p.id}>
                  <span className="text-foreground">
                    {f.p.name} — {f.action}.
                  </span>{" "}
                  {f.reason}
                </li>
              ))}
              {facts.length === 0 ? <li>No product currently needs attention.</li> : null}
            </ul>
          </div>

          {ai.data ? (
            <div className="panel-raised p-4">
              <div className="label-mono">AI explanation</div>
              <div className="mt-2 space-y-1.5 text-[13px] whitespace-pre-wrap text-muted-foreground">
                {ai.data.ok ? ai.data.text : ai.data.text}
              </div>
            </div>
          ) : null}

          {ai.isError ? (
            <p className="text-[13px] text-danger">
              The analysis could not run just now. Please try again.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
