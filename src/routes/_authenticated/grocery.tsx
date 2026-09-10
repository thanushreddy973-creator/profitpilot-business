import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { formatMoney } from "@/lib/currencies";
import {
  useDeleteGroceryItem,
  useGroceryItems,
  useProducts,
  useProfile,
  useSaveGroceryItem,
  useSuppliers,
  useTogglePurchased,
  type GroceryInput,
} from "@/lib/data";
import type { GroceryItem } from "@/lib/types";
import { Chip, EmptyState, SectionHeader, Stat } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/grocery")({
  head: () => ({
    meta: [
      { title: "Grocery List — ProfitPilot" },
      { name: "description", content: "Plan what to buy, from which seller, and at what cost." },
      { property: "og:title", content: "Grocery List — ProfitPilot" },
      { property: "og:description", content: "Plan purchases and push them into stock when bought." },
    ],
  }),
  component: Grocery,
});

const BLANK: GroceryInput = {
  name: "",
  product_id: null,
  supplier_id: null,
  quantity_needed: 1,
  purchase_price: 0,
  is_available: true,
  notes: "",
};

function Grocery() {
  const { data: profile } = useProfile();
  const { data: items = [] } = useGroceryItems();
  const { data: products = [] } = useProducts();
  const { data: suppliers = [] } = useSuppliers();
  const save = useSaveGroceryItem();
  const remove = useDeleteGroceryItem();
  const toggle = useTogglePurchased();
  const code = profile?.currency_code ?? "USD";

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GroceryItem | null>(null);
  const [form, setForm] = useState<GroceryInput>(BLANK);
  const [updateStock, setUpdateStock] = useState(true);
  const [recordExpense, setRecordExpense] = useState(true);

  const pending = items.filter((i) => !i.is_purchased);
  const estimate = pending.reduce(
    (a, i) => a + Number(i.quantity_needed) * Number(i.purchase_price),
    0,
  );

  function startAdd() {
    setEditing(null);
    setForm(BLANK);
    setOpen(true);
  }

  function startEdit(i: GroceryItem) {
    setEditing(i);
    setForm({
      name: i.name,
      product_id: i.product_id,
      supplier_id: i.supplier_id,
      quantity_needed: i.quantity_needed,
      purchase_price: i.purchase_price,
      is_available: i.is_available,
      notes: i.notes,
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
        title="Grocery list"
        description="What you still need to buy, who from, and what it will cost."
        action={
          <button className="btn" onClick={startAdd}>
            Add item
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Still to buy" value={String(pending.length)} />
        <Stat label="Estimated cost" value={formatMoney(estimate, code)} tone="warn" />
      </div>

      <div className="panel mb-4 flex flex-wrap items-center gap-4 p-3 text-[12px] text-muted-foreground">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={updateStock}
            onChange={(e) => setUpdateStock(e.target.checked)}
          />
          Add bought quantity to linked product stock
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={recordExpense}
            onChange={(e) => setRecordExpense(e.target.checked)}
          />
          Record the purchase as an expense
        </label>
      </div>

      {open ? (
        <form onSubmit={submit} className="panel-raised mb-4 grid gap-3 p-4 md:grid-cols-3">
          <F label="Item name">
            <input
              className="field"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </F>
          <F label="Linked product">
            <select
              className="field"
              value={form.product_id ?? ""}
              onChange={(e) => {
                const id = e.target.value || null;
                const product = products.find((p) => p.id === id);
                setForm({
                  ...form,
                  product_id: id,
                  name: form.name || (product?.name ?? ""),
                  supplier_id: form.supplier_id ?? product?.supplier_id ?? null,
                  purchase_price: form.purchase_price || Number(product?.cost_price ?? 0),
                });
              }}
            >
              <option value="">Not linked</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (stock {p.quantity})
                </option>
              ))}
            </select>
          </F>
          <F label="Preferred seller">
            <select
              className="field"
              value={form.supplier_id ?? ""}
              onChange={(e) => setForm({ ...form, supplier_id: e.target.value || null })}
            >
              <option value="">No seller</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </F>
          <F label="Quantity needed">
            <input
              className="field num"
              type="number"
              step="any"
              value={form.quantity_needed}
              onChange={(e) => setForm({ ...form, quantity_needed: Number(e.target.value) })}
            />
          </F>
          <F label={`Purchase price (${code})`}>
            <input
              className="field num"
              type="number"
              step="any"
              value={form.purchase_price}
              onChange={(e) => setForm({ ...form, purchase_price: Number(e.target.value) })}
            />
          </F>
          <F label="Availability">
            <select
              className="field"
              value={form.is_available ? "yes" : "no"}
              onChange={(e) => setForm({ ...form, is_available: e.target.value === "yes" })}
            >
              <option value="yes">Available</option>
              <option value="no">Unavailable</option>
            </select>
          </F>
          <div className="md:col-span-3">
            <F label="Notes">
              <input
                className="field"
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </F>
          </div>
          <div className="flex gap-2 md:col-span-3">
            <button className="btn" type="submit" disabled={save.isPending}>
              {editing ? "Save changes" : "Add item"}
            </button>
            <button className="btn-ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Your list is empty"
          body="Add what you need to buy and ProfitPilot totals the cost for you."
          action={
            <button className="btn" onClick={startAdd}>
              Add item
            </button>
          }
        />
      ) : (
        <div className="grid gap-2.5">
          {items.map((i) => {
            const product = products.find((p) => p.id === i.product_id);
            const seller = suppliers.find((s) => s.id === i.supplier_id);
            const total = Number(i.quantity_needed) * Number(i.purchase_price);
            return (
              <div key={i.id} className="panel flex flex-wrap items-center gap-3 p-3.5">
                <div className="min-w-[160px] flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[14px] font-semibold ${i.is_purchased ? "text-faint line-through" : ""}`}
                    >
                      {i.name}
                    </span>
                    <Chip tone={i.is_available ? "ok" : "danger"}>
                      {i.is_available ? "AVAILABLE" : "UNAVAILABLE"}
                    </Chip>
                  </div>
                  <div className="num mt-1 text-[11px] text-faint">
                    Need {i.quantity_needed}
                    {product ? ` · in stock ${product.quantity}` : ""}
                    {seller ? ` · ${seller.name}` : ""}
                  </div>
                  {i.notes ? <p className="mt-1 text-[12px] text-muted-foreground">{i.notes}</p> : null}
                </div>
                <div className="num text-[12px] text-muted-foreground">
                  {formatMoney(Number(i.purchase_price), code)} × {i.quantity_needed} ={" "}
                  {formatMoney(total, code)}
                </div>
                <div className="flex gap-2">
                  <button
                    className={i.is_purchased ? "btn-ghost" : "btn"}
                    onClick={() =>
                      toggle.mutate({
                        item: i,
                        purchased: !i.is_purchased,
                        updateStock,
                        recordExpense,
                      })
                    }
                  >
                    {i.is_purchased ? "Mark not bought" : "Mark bought"}
                  </button>
                  <button className="btn-ghost" onClick={() => startEdit(i)}>
                    Edit
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      if (confirm(`Delete ${i.name}?`)) remove.mutate(i.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
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
