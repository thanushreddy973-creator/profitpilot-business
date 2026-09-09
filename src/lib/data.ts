import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GroceryItem, Product, Profile, Supplier, Transaction } from "./types";

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

/* ---------- profile ---------- */

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const uid = await currentUserId();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as unknown as Profile;
      const { data: created, error: insertError } = await supabase
        .from("profiles")
        .insert({ id: uid })
        .select("*")
        .single();
      if (insertError) throw insertError;
      return created as unknown as Profile;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const uid = await currentUserId();
      const { error } = await supabase.from("profiles").update(patch).eq("id", uid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

/* ---------- generic table helpers ---------- */

function useRows<T>(table: "products" | "suppliers" | "grocery_items" | "transactions", order: string) {
  return useQuery({
    queryKey: [table],
    queryFn: async (): Promise<T[]> => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(order, { ascending: table === "products" || table === "suppliers" });
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
  });
}

export const useProducts = () => useRows<Product>("products", "name");
export const useSuppliers = () => useRows<Supplier>("suppliers", "name");
export const useGroceryItems = () => useRows<GroceryItem>("grocery_items", "created_at");
export const useTransactions = () => useRows<Transaction>("transactions", "occurred_on");

function useTableMutation<TVars>(
  fn: (vars: TVars) => Promise<void>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries(),
  });
}

/* ---------- products ---------- */

export type ProductInput = Omit<Product, "id" | "user_id" | "created_at">;

export const useSaveProduct = () =>
  useTableMutation<{ id?: string; values: ProductInput }>(async ({ id, values }) => {
    if (id) {
      const { error } = await supabase.from("products").update(values).eq("id", id);
      if (error) throw error;
    } else {
      const uid = await currentUserId();
      const { error } = await supabase.from("products").insert({ ...values, user_id: uid });
      if (error) throw error;
    }
  });

export const useDeleteProduct = () =>
  useTableMutation<string>(async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  });

/* ---------- suppliers ---------- */

export type SupplierInput = Omit<Supplier, "id" | "user_id" | "created_at">;

export const useSaveSupplier = () =>
  useTableMutation<{ id?: string; values: SupplierInput }>(async ({ id, values }) => {
    if (id) {
      const { error } = await supabase.from("suppliers").update(values).eq("id", id);
      if (error) throw error;
    } else {
      const uid = await currentUserId();
      const { error } = await supabase.from("suppliers").insert({ ...values, user_id: uid });
      if (error) throw error;
    }
  });

export const useDeleteSupplier = () =>
  useTableMutation<string>(async (id) => {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) throw error;
  });

/* ---------- grocery ---------- */

export type GroceryInput = Omit<
  GroceryItem,
  "id" | "user_id" | "created_at" | "is_purchased" | "purchased_at"
>;

export const useSaveGroceryItem = () =>
  useTableMutation<{ id?: string; values: GroceryInput }>(async ({ id, values }) => {
    if (id) {
      const { error } = await supabase.from("grocery_items").update(values).eq("id", id);
      if (error) throw error;
    } else {
      const uid = await currentUserId();
      const { error } = await supabase.from("grocery_items").insert({ ...values, user_id: uid });
      if (error) throw error;
    }
  });

export const useDeleteGroceryItem = () =>
  useTableMutation<string>(async (id) => {
    const { error } = await supabase.from("grocery_items").delete().eq("id", id);
    if (error) throw error;
  });

/**
 * Marking an item purchased optionally adds the bought quantity to the linked
 * product's stock and records the spend as an expense transaction.
 */
export const useTogglePurchased = () =>
  useTableMutation<{
    item: GroceryItem;
    purchased: boolean;
    updateStock: boolean;
    recordExpense: boolean;
  }>(async ({ item, purchased, updateStock, recordExpense }) => {
    const uid = await currentUserId();
    const { error } = await supabase
      .from("grocery_items")
      .update({ is_purchased: purchased, purchased_at: purchased ? new Date().toISOString() : null })
      .eq("id", item.id);
    if (error) throw error;

    if (purchased && updateStock && item.product_id) {
      const { data: product, error: readError } = await supabase
        .from("products")
        .select("quantity")
        .eq("id", item.product_id)
        .single();
      if (readError) throw readError;
      const next = Number(product.quantity) + Number(item.quantity_needed);
      const { error: stockError } = await supabase
        .from("products")
        .update({ quantity: next })
        .eq("id", item.product_id);
      if (stockError) throw stockError;
    }

    if (purchased && recordExpense) {
      const total = Number(item.quantity_needed) * Number(item.purchase_price);
      if (total > 0) {
        const { error: txError } = await supabase.from("transactions").insert({
          user_id: uid,
          type: "expense",
          amount: total,
          category: "Inventory purchase",
          description: `Purchased ${item.quantity_needed} × ${item.name}`,
          product_id: item.product_id,
        });
        if (txError) throw txError;
      }
    }
  });

/* ---------- transactions ---------- */

export type TransactionInput = Omit<Transaction, "id" | "user_id" | "created_at">;

export const useSaveTransaction = () =>
  useTableMutation<{ id?: string; values: TransactionInput }>(async ({ id, values }) => {
    if (id) {
      const { error } = await supabase.from("transactions").update(values).eq("id", id);
      if (error) throw error;
    } else {
      const uid = await currentUserId();
      const { error } = await supabase.from("transactions").insert({ ...values, user_id: uid });
      if (error) throw error;
    }
  });

export const useDeleteTransaction = () =>
  useTableMutation<string>(async (id) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
  });
