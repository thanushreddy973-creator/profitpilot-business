import { useCurrency, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { cashSummary } from "@/lib/analysis";
import { formatMoney } from "@/lib/currencies";
import { useProducts, useProfile, useTransactions } from "@/lib/data";
import { EmptyState, SectionHeader, Stat } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/simulator")({
  head: () => ({
    meta: [
      { title: "What-If Simulator — ProfitPilot" },
      { name: "description", content: "Test price, quantity and expense changes before you commit to them." },
      { property: "og:title", content: "What-If Simulator — ProfitPilot" },
      { property: "og:description", content: "Compare current results with a simulated scenario." },
    ],
  }),
  component: Simulator,
});

function Simulator() {
  const { data: profile } = useProfile();
  const { data: products = [] } = useProducts();
  const { data: transactions = [] } = useTransactions();
  const code = useCurrency();
  const summary = cashSummary(transactions, products, profile);

  const [productId, setProductId] = useState("");
  const product = products.find((p) => p.id === productId) ?? products[0];

  const [quantity, setQuantity] = useState<number | null>(null);
  const [sellPrice, setSellPrice] = useState<number | null>(null);
  const [costPrice, setCostPrice] = useState<number | null>(null);
  const [expectedSales, setExpectedSales] = useState(0);
  const [extraExpenses, setExtraExpenses] = useState(0);

  const base = useMemo(() => {
    if (!product) return null;
    return {
      quantity: Number(product.quantity),
      sellPrice: Number(product.selling_price),
      costPrice: Number(product.cost_price),
    };
  }, [product]);

  if (products.length === 0) {
    return (
      <div>
        <SectionHeader title="What-If Simulator" />
        <EmptyState
          title="Nothing to simulate yet"
          body="Add at least one product so the simulator has real prices and quantities to work from."
        />
      </div>
    );
  }

  const b = base!;
  const simQty = quantity ?? b.quantity;
  const simSell = sellPrice ?? b.sellPrice;
  const simCost = costPrice ?? b.costPrice;
  const units = Math.min(expectedSales, simQty);

  const currentRevenue = Math.min(expectedSales, b.quantity) * b.sellPrice;
  const currentCost = Math.min(expectedSales, b.quantity) * b.costPrice;
  const currentProfit = currentRevenue - currentCost;

  const simRevenue = units * simSell;
  const simCostTotal = units * simCost + extraExpenses;
  const simProfit = simRevenue - simCostTotal;
  const cashImpact = summary.balance + simProfit;

  function diff(a: number, bb: number) {
    const d = a - bb;
    return `${d >= 0 ? "+" : "−"}${formatMoney(Math.abs(d), code)}`;
  }

  return (
    <div>
      <SectionHeader
        title="What-If Simulator"
        description="Change the numbers on the left and compare the result with where you stand today."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel-raised grid gap-3 p-4">
          <F label="Product">
            <select
              className="field"
              value={product?.id ?? ""}
              onChange={(e) => {
                setProductId(e.target.value);
                setQuantity(null);
                setSellPrice(null);
                setCostPrice(null);
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </F>
          <F label={`Quantity in stock (now ${b.quantity})`}>
            <input
              className="field num"
              type="number"
              step="any"
              value={simQty}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </F>
          <F label={`Selling price (now ${formatMoney(b.sellPrice, code)})`}>
            <input
              className="field num"
              type="number"
              step="any"
              value={simSell}
              onChange={(e) => setSellPrice(Number(e.target.value))}
            />
          </F>
          <F label={`Purchase price (now ${formatMoney(b.costPrice, code)})`}>
            <input
              className="field num"
              type="number"
              step="any"
              value={simCost}
              onChange={(e) => setCostPrice(Number(e.target.value))}
            />
          </F>
          <F label="Expected units sold">
            <input
              className="field num"
              type="number"
              step="any"
              value={expectedSales}
              onChange={(e) => setExpectedSales(Number(e.target.value))}
            />
          </F>
          <F label={`Extra expenses (${code})`}>
            <input
              className="field num"
              type="number"
              step="any"
              value={extraExpenses}
              onChange={(e) => setExtraExpenses(Number(e.target.value))}
            />
          </F>
          <p className="text-[12px] text-faint">
            Nothing here is saved — the simulator never changes your real data.
          </p>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Simulated revenue" value={formatMoney(simRevenue, code)} tone="ok" />
            <Stat label="Simulated costs" value={formatMoney(simCostTotal, code)} tone="danger" />
            <Stat
              label="Simulated profit"
              value={formatMoney(simProfit, code)}
              tone={simProfit >= 0 ? "ok" : "danger"}
            />
            <Stat label="Cash after scenario" value={formatMoney(cashImpact, code)} tone="accent" />
          </div>

          <div className="panel p-4">
            <div className="label-mono">Compared with today</div>
            <ul className="mt-2 space-y-1.5 text-[13px] text-muted-foreground">
              <li>
                Revenue {diff(simRevenue, currentRevenue)} against {formatMoney(currentRevenue, code)} at
                current prices.
              </li>
              <li>
                Costs {diff(simCostTotal, currentCost)} against {formatMoney(currentCost, code)}.
              </li>
              <li>
                Profit {diff(simProfit, currentProfit)} against {formatMoney(currentProfit, code)}.
              </li>
              <li>
                Cash balance moves from {formatMoney(summary.balance, code)} to{" "}
                {formatMoney(cashImpact, code)}.
              </li>
              {expectedSales > simQty ? (
                <li className="text-warn">
                  You expect to sell {expectedSales} but only {simQty} would be in stock, so the extra
                  sales are not counted.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-mono mb-1">{label}</div>
      {children}
    </div>
  );
}
