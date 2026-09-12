import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { STOCK_LABEL, STOCK_TONE, stockStatus, type StockStatus } from "@/lib/analysis";
import { formatMoney } from "@/lib/currencies";
import {
  useDeleteProduct,
  useProducts,
  useProfile,
  useSaveProduct,
  useSuppliers,
  type ProductInput,
  useCurrency,
} from "@/lib/data";
import type { Product } from "@/lib/types";
import { EmptyState, SectionHeader } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — ProfitPilot" },
      { name: "description", content: "Add, edit and track products, costs, prices and stock levels." },
      { property: "og:title", content: "Inventory — ProfitPilot" },
      { property: "og:description", content: "Track products, costs, prices and stock levels." },
    ],
  }),
  component: Inventory,
});

const BLANK: ProductInput = {
  name: "",
  sku: "",
  category: "General",
  quantity: 0,
  min_stock: 0,
  cost_price: 0,
  selling_price: 0,
  supplier_id: null,
  is_available: true,
  notes: "",
};

function Inventory() {
  const { data: profile } = useProfile();
  const { data: products = [] } = useProducts();
  const { data: suppliers = [] } = useSuppliers();
  const save = useSaveProduct();
  const remove = useDeleteProduct();
  const code = useCurrency();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(BLANK);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<"all" | StockStatus>("all");

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(),
    [products],
  );

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (q && !`${p.name} ${p.sku ?? ""} ${p.category}`.toLowerCase().includes(q)) return false;
    if (category !== "all" && p.category !== category) return false;
    if (status !== "all" && stockStatus(p, profile) !== status) return false;
    return true;
  });

  function startAdd() {
    setEditing(null);
    setForm(BLANK);
    setOpen(true);
  }

  function startEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      quantity: p.quantity,
      min_stock: p.min_stock,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      supplier_id: p.supplier_id,
      is_available: p.is_available,
      notes: p.notes,
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await save.mutateAsync({ ...(editing ? { id: editing.id } : {}), values: form });
    setOpen(false);
  }

  return (
    <div>
      <SectionHeader
        title="Inventory"
        description="Every product carries its cost, price, minimum level and supplier."
        action={
          <button className="btn" onClick={startAdd}>
            Add product
          </button>
        }
      />

      <div className="mb-4 grid gap-2 md:grid-cols-3">
        <input
          className="field"
          placeholder="Search name, code or category"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="field"
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | StockStatus)}
        >
          <option value="all">All stock levels</option>
          <option value="out">Out of stock</option>
          <option value="low">Low</option>
          <option value="healthy">Healthy</option>
          <option value="overstock">Overstock</option>
        </select>
      </div>

      {open ? (
        <form onSubmit={submit} className="panel-raised mb-4 grid gap-3 p-4 md:grid-cols-3">
          <Field label="Name">
            <input
              className="field"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Code / SKU">
            <input
              className="field"
              value={form.sku ?? ""}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </Field>
          <Field label="Category">
            <input
              className="field"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </Field>
          <Field label="Quantity">
            <input
              className="field num"
              type="number"
              step="any"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            />
          </Field>
          <Field label="Minimum stock">
            <input
              className="field num"
              type="number"
              step="any"
              value={form.min_stock}
              onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })}
            />
          </Field>
          <Field label="Supplier">
            <select
              className="field"
              value={form.supplier_id ?? ""}
              onChange={(e) => setForm({ ...form, supplier_id: e.target.value || null })}
            >
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Cost price (${code})`}>
            <input
              className="field num"
              type="number"
              step="any"
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
            />
          </Field>
          <Field label={`Selling price (${code})`}>
            <input
              className="field num"
              type="number"
              step="any"
              value={form.selling_price}
              onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })}
            />
          </Field>
          <Field label="Availability">
            <select
              className="field"
              value={form.is_available ? "yes" : "no"}
              onChange={(e) => setForm({ ...form, is_available: e.target.value === "yes" })}
            >
              <option value="yes">Available</option>
              <option value="no">Unavailable</option>
            </select>
          </Field>
          <div className="md:col-span-3">
            <Field label="Notes">
              <textarea
                className="field"
                rows={2}
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex gap-2 md:col-span-3">
            <button className="btn" type="submit" disabled={save.isPending}>
              {editing ? "Save changes" : "Add product"}
            </button>
            <button className="btn-ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          body="Add your first product to start tracking stock, costs and margins."
          action={
            <button className="btn" onClick={startAdd}>
              Add product
            </button>
          }
        />
      ) : (
        <div className="grid gap-2.5">
          {filtered.map((p) => {
            const st = stockStatus(p, profile);
            const supplier = suppliers.find((s) => s.id === p.supplier_id);
            return (
              <div key={p.id} className="panel flex flex-wrap items-center gap-3 p-3.5">
                <div className="min-w-[160px] flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold">{p.name}</span>
                    <span className={`num rounded-md px-2 py-0.5 text-[10px] ${STOCK_TONE[st]}`}>
                      {STOCK_LABEL[st]}
                    </span>
                    {!p.is_available ? (
                      <span className="num rounded-md bg-elevated px-2 py-0.5 text-[10px] text-faint">
                        UNAVAILABLE
                      </span>
                    ) : null}
                  </div>
                  <div className="num mt-1 text-[11px] text-faint">
                    {p.category}
                    {p.sku ? ` · ${p.sku}` : ""}
                    {supplier ? ` · ${supplier.name}` : ""}
                  </div>
                </div>
                <div className="num text-[12px] text-muted-foreground">
                  Qty {p.quantity} / min {p.min_stock}
                </div>
                <div className="num text-[12px] text-muted-foreground">
                  {formatMoney(Number(p.cost_price), code)} → {formatMoney(Number(p.selling_price), code)}
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      if (confirm(`Delete ${p.name}?`)) remove.mutate(p.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No products match these filters.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-mono mb-1">{label}</div>
      {children}
    </div>
  );
}
