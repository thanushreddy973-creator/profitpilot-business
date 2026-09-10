import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { formatMoney } from "@/lib/currencies";
import {
  useDeleteSupplier,
  useProducts,
  useProfile,
  useSaveSupplier,
  useSuppliers,
  type SupplierInput,
} from "@/lib/data";
import type { Supplier } from "@/lib/types";
import { Chip, EmptyState, SectionHeader } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/suppliers")({
  head: () => ({
    meta: [
      { title: "Sellers — ProfitPilot" },
      { name: "description", content: "Manage suppliers, contacts, prices and what they supply." },
      { property: "og:title", content: "Sellers — ProfitPilot" },
      { property: "og:description", content: "Manage suppliers, contacts and purchase prices." },
    ],
  }),
  component: Sellers,
});

const BLANK: SupplierInput = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  products_supplied: "",
  purchase_price: 0,
  is_available: true,
  notes: "",
};

function Sellers() {
  const { data: profile } = useProfile();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();
  const save = useSaveSupplier();
  const remove = useDeleteSupplier();
  const code = profile?.currency_code ?? "USD";

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierInput>(BLANK);
  const [search, setSearch] = useState("");

  const filtered = suppliers.filter((s) =>
    `${s.name} ${s.contact_name ?? ""} ${s.products_supplied ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  function startAdd() {
    setEditing(null);
    setForm(BLANK);
    setOpen(true);
  }

  function startEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      contact_name: s.contact_name,
      email: s.email,
      phone: s.phone,
      address: s.address,
      products_supplied: s.products_supplied,
      purchase_price: s.purchase_price,
      is_available: s.is_available,
      notes: s.notes,
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
        title="Sellers"
        description="Suppliers you buy from, with contact details and their prices."
        action={
          <button className="btn" onClick={startAdd}>
            Add seller
          </button>
        }
      />

      <input
        className="field mb-4 md:max-w-sm"
        placeholder="Search sellers"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {open ? (
        <form onSubmit={submit} className="panel-raised mb-4 grid gap-3 p-4 md:grid-cols-3">
          <F label="Seller name">
            <input
              className="field"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </F>
          <F label="Contact person">
            <input
              className="field"
              value={form.contact_name ?? ""}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
            />
          </F>
          <F label="Phone">
            <input
              className="field"
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </F>
          <F label="Email">
            <input
              className="field"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </F>
          <F label="Address">
            <input
              className="field"
              value={form.address ?? ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </F>
          <F label={`Typical purchase price (${code})`}>
            <input
              className="field num"
              type="number"
              step="any"
              value={form.purchase_price ?? 0}
              onChange={(e) => setForm({ ...form, purchase_price: Number(e.target.value) })}
            />
          </F>
          <F label="Products supplied">
            <input
              className="field"
              value={form.products_supplied ?? ""}
              onChange={(e) => setForm({ ...form, products_supplied: e.target.value })}
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
          <F label="Notes">
            <input
              className="field"
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </F>
          <div className="flex gap-2 md:col-span-3">
            <button className="btn" type="submit" disabled={save.isPending}>
              {editing ? "Save changes" : "Add seller"}
            </button>
            <button className="btn-ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {suppliers.length === 0 ? (
        <EmptyState
          title="No sellers yet"
          body="Add the suppliers you buy from so products and grocery items can point at them."
          action={
            <button className="btn" onClick={startAdd}>
              Add seller
            </button>
          }
        />
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {filtered.map((s) => {
            const linked = products.filter((p) => p.supplier_id === s.id);
            return (
              <div key={s.id} className="panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-semibold">{s.name}</div>
                    <div className="num mt-1 text-[11px] text-faint">
                      {[s.contact_name, s.phone, s.email].filter(Boolean).join(" · ") || "No contact details"}
                    </div>
                  </div>
                  <Chip tone={s.is_available ? "ok" : "danger"}>
                    {s.is_available ? "AVAILABLE" : "UNAVAILABLE"}
                  </Chip>
                </div>
                {s.products_supplied ? (
                  <p className="mt-2 text-[13px] text-muted-foreground">{s.products_supplied}</p>
                ) : null}
                <div className="num mt-2 text-[12px] text-muted-foreground">
                  Price {formatMoney(Number(s.purchase_price ?? 0), code)} · {linked.length} linked product(s)
                </div>
                {s.notes ? <p className="mt-2 text-[12px] text-faint">{s.notes}</p> : null}
                <div className="mt-3 flex gap-2">
                  <button className="btn-ghost" onClick={() => startEdit(s)}>
                    Edit
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      if (confirm(`Delete ${s.name}?`)) remove.mutate(s.id);
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
