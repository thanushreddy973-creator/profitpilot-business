import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { cashSummary } from "@/lib/analysis";
import { formatMoney } from "@/lib/currencies";
import {
  useDeleteTransaction,
  useProducts,
  useProfile,
  useSaveTransaction,
  useTransactions,
  type TransactionInput,
} from "@/lib/data";
import type { Transaction } from "@/lib/types";
import { Chip, EmptyState, SectionHeader, Stat } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/cash-flow")({
  head: () => ({
    meta: [
      { title: "Cash Flow Radar — ProfitPilot" },
      { name: "description", content: "Income, expenses, balance and upcoming costs from your own records." },
      { property: "og:title", content: "Cash Flow Radar — ProfitPilot" },
      { property: "og:description", content: "Track money in, money out and cash-flow risk." },
    ],
  }),
  component: CashFlow,
});

function blank(): TransactionInput {
  return {
    type: "income",
    amount: 0,
    category: "Sales",
    description: "",
    product_id: null,
    occurred_on: new Date().toISOString().slice(0, 10),
    is_upcoming: false,
  };
}

function CashFlow() {
  const { data: profile } = useProfile();
  const { data: transactions = [] } = useTransactions();
  const { data: products = [] } = useProducts();
  const save = useSaveTransaction();
  const remove = useDeleteTransaction();
  const code = profile?.currency_code ?? "USD";
  const s = cashSummary(transactions, products, profile);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState<TransactionInput>(blank());
  const [filter, setFilter] = useState<"all" | "income" | "expense" | "upcoming">("all");

  const rows = transactions.filter((t) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return t.is_upcoming;
    return t.type === filter && !t.is_upcoming;
  });

  function startAdd() {
    setEditing(null);
    setForm(blank());
    setOpen(true);
  }

  function startEdit(t: Transaction) {
    setEditing(t);
    setForm({
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      product_id: t.product_id,
      occurred_on: t.occurred_on.slice(0, 10),
      is_upcoming: t.is_upcoming,
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await save.mutateAsync({ id: editing?.id, values: form });
    setOpen(false);
  }

  return (
    <div>
      <SectionHeader
        title="Cash Flow Radar"
        description="Money in, money out and what is still coming — all from what you recorded."
        action={
          <button className="btn" onClick={startAdd}>
            Add transaction
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Cash balance" value={formatMoney(s.balance, code)} tone="accent" wide />
        <Stat label="Money in" value={formatMoney(s.income, code)} tone="ok" />
        <Stat label="Money out" value={formatMoney(s.expenses, code)} tone="danger" />
        <Stat
          label="Estimated profit"
          value={formatMoney(s.profit, code)}
          tone={s.profit >= 0 ? "ok" : "danger"}
        />
        <Stat label="Upcoming expenses" value={formatMoney(s.upcomingExpenses, code)} tone="warn" />
        <Stat label="Upcoming income" value={formatMoney(s.upcomingIncome, code)} />
      </div>

      <div className="panel mt-3 flex flex-wrap items-center gap-2 p-4">
        <Chip
          tone={
            s.risk === "High" ? "danger" : s.risk === "Moderate" ? "warn" : s.risk === "Low" ? "ok" : "muted"
          }
        >
          RISK · {s.risk.toUpperCase()}
        </Chip>
        <span className="text-[13px] text-muted-foreground">{s.riskReason}</span>
      </div>

      {open ? (
        <form onSubmit={submit} className="panel-raised mt-4 grid gap-3 p-4 md:grid-cols-3">
          <F label="Type">
            <select
              className="field"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "income" | "expense" })}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </F>
          <F label={`Amount (${code})`}>
            <input
              className="field num"
              type="number"
              step="any"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </F>
          <F label="Category">
            <input
              className="field"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </F>
          <F label="Date">
            <input
              className="field num"
              type="date"
              value={form.occurred_on}
              onChange={(e) => setForm({ ...form, occurred_on: e.target.value })}
            />
          </F>
          <F label="Related product">
            <select
              className="field"
              value={form.product_id ?? ""}
              onChange={(e) => setForm({ ...form, product_id: e.target.value || null })}
            >
              <option value="">None</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </F>
          <F label="Timing">
            <select
              className="field"
              value={form.is_upcoming ? "upcoming" : "settled"}
              onChange={(e) => setForm({ ...form, is_upcoming: e.target.value === "upcoming" })}
            >
              <option value="settled">Already happened</option>
              <option value="upcoming">Upcoming / expected</option>
            </select>
          </F>
          <div className="md:col-span-3">
            <F label="Description">
              <input
                className="field"
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </F>
          </div>
          <div className="flex gap-2 md:col-span-3">
            <button className="btn" type="submit" disabled={save.isPending}>
              {editing ? "Save changes" : "Add transaction"}
            </button>
            <button className="btn-ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-5 mb-3 flex flex-wrap gap-2">
        {(["all", "income", "expense", "upcoming"] as const).map((f) => (
          <button
            key={f}
            className={filter === f ? "btn" : "btn-ghost"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "upcoming" ? "Upcoming" : f === "income" ? "Income" : "Expenses"}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          body="Record your first sale or expense and the balance, profit and risk reading appear here."
          action={
            <button className="btn" onClick={startAdd}>
              Add transaction
            </button>
          }
        />
      ) : (
        <div className="grid gap-2">
          {rows.map((t) => (
            <div key={t.id} className="panel flex flex-wrap items-center gap-3 p-3.5">
              <div className="min-w-[150px] flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold">{t.category}</span>
                  <Chip tone={t.type === "income" ? "ok" : "danger"}>{t.type.toUpperCase()}</Chip>
                  {t.is_upcoming ? <Chip tone="warn">UPCOMING</Chip> : null}
                </div>
                <div className="num mt-1 text-[11px] text-faint">
                  {t.occurred_on.slice(0, 10)}
                  {t.description ? ` · ${t.description}` : ""}
                </div>
              </div>
              <div
                className={`num text-[14px] font-semibold ${t.type === "income" ? "text-ok" : "text-danger"}`}
              >
                {t.type === "income" ? "+" : "−"}
                {formatMoney(Number(t.amount), code)}
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => startEdit(t)}>
                  Edit
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    if (confirm("Delete this transaction?")) remove.mutate(t.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Nothing in this view.</p>
          ) : null}
        </div>
      )}
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
