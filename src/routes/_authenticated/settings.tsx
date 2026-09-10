import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CURRENCIES, formatMoney } from "@/lib/currencies";
import { useProfile, useUpdateProfile } from "@/lib/data";
import { SectionHeader } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ProfitPilot" },
      { name: "description", content: "Set your business name, currency, opening balance and stock thresholds." },
      { property: "og:title", content: "Settings — ProfitPilot" },
      { property: "og:description", content: "Business name, currency and stock thresholds." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    full_name: "",
    currency_code: "USD",
    opening_balance: 0,
    low_stock_buffer: 0,
    overstock_multiplier: 3,
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (profile)
      setForm({
        business_name: profile.business_name ?? "",
        full_name: profile.full_name ?? "",
        currency_code: profile.currency_code ?? "USD",
        opening_balance: Number(profile.opening_balance ?? 0),
        low_stock_buffer: Number(profile.low_stock_buffer ?? 0),
        overstock_multiplier: Number(profile.overstock_multiplier ?? 3),
      });
  }, [profile]);

  const list = CURRENCIES.filter((c) =>
    `${c.code} ${c.name}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await update.mutateAsync(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <SectionHeader
        title="Settings"
        description="These values drive every calculation in your workspace."
      />

      <form onSubmit={submit} className="panel-raised grid gap-3 p-4 md:grid-cols-2">
        <F label="Business name">
          <input
            className="field"
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
          />
        </F>
        <F label="Your name">
          <input
            className="field"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </F>
        <F label="Search currency">
          <input
            className="field"
            placeholder="e.g. rupee, euro, NGN"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </F>
        <F label="Currency">
          <select
            className="field"
            value={form.currency_code}
            onChange={(e) => setForm({ ...form, currency_code: e.target.value })}
          >
            {list.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.name} ({c.symbol})
              </option>
            ))}
          </select>
        </F>
        <F label="Opening cash balance">
          <input
            className="field num"
            type="number"
            step="any"
            value={form.opening_balance}
            onChange={(e) => setForm({ ...form, opening_balance: Number(e.target.value) })}
          />
        </F>
        <F label="Low-stock buffer (extra units)">
          <input
            className="field num"
            type="number"
            step="any"
            value={form.low_stock_buffer}
            onChange={(e) => setForm({ ...form, low_stock_buffer: Number(e.target.value) })}
          />
        </F>
        <F label="Overstock multiplier (× minimum)">
          <input
            className="field num"
            type="number"
            step="any"
            min={1}
            value={form.overstock_multiplier}
            onChange={(e) => setForm({ ...form, overstock_multiplier: Number(e.target.value) })}
          />
        </F>
        <div className="flex items-center gap-3 md:col-span-2">
          <button className="btn" type="submit" disabled={update.isPending}>
            Save settings
          </button>
          <span className="num text-[12px] text-muted-foreground">
            Preview: {formatMoney(1234.5, form.currency_code)}
          </span>
          {saved ? <span className="text-[12px] text-ok">Saved</span> : null}
        </div>
      </form>
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
