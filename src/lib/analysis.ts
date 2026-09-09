import type { Product, Profile, Transaction } from "./types";

export type StockStatus = "out" | "low" | "healthy" | "overstock";

export function stockStatus(p: Product, profile?: Profile | null): StockStatus {
  const buffer = Number(profile?.low_stock_buffer ?? 0);
  const multiplier = Number(profile?.overstock_multiplier ?? 3) || 3;
  const qty = Number(p.quantity);
  const min = Number(p.min_stock);
  if (qty <= 0) return "out";
  if (qty <= min + buffer) return "low";
  if (min > 0 && qty >= min * multiplier) return "overstock";
  return "healthy";
}

export const STOCK_LABEL: Record<StockStatus, string> = {
  out: "OUT OF STOCK",
  low: "LOW",
  healthy: "HEALTHY",
  overstock: "OVERSTOCK",
};

export const STOCK_TONE: Record<StockStatus, string> = {
  out: "bg-danger/15 text-danger",
  low: "bg-danger/12 text-danger",
  healthy: "bg-ok/12 text-ok",
  overstock: "bg-warn/12 text-warn",
};

export type Recommendation = "Reorder" | "Reduce purchasing" | "Monitor" | "Healthy stock";

export function recommendation(p: Product, profile?: Profile | null): {
  action: Recommendation;
  reason: string;
} {
  const status = stockStatus(p, profile);
  const qty = Number(p.quantity);
  const min = Number(p.min_stock);
  if (status === "out")
    return { action: "Reorder", reason: `Stock is at zero, so this product cannot be sold right now.` };
  if (status === "low")
    return {
      action: "Reorder",
      reason: `Only ${qty} left against a minimum of ${min}. Restock before it runs out.`,
    };
  if (status === "overstock")
    return {
      action: "Reduce purchasing",
      reason: `${qty} units on hand is well above the minimum of ${min}. Cash is tied up in shelf stock.`,
    };
  if (min > 0 && qty <= min * 1.5)
    return {
      action: "Monitor",
      reason: `${qty} units is close to the minimum of ${min}. Keep an eye on it this week.`,
    };
  return { action: "Healthy stock", reason: `${qty} units comfortably covers the minimum of ${min}.` };
}

export type CashSummary = {
  income: number;
  expenses: number;
  upcomingExpenses: number;
  upcomingIncome: number;
  profit: number;
  balance: number;
  inventoryValue: number;
  potentialRevenue: number;
  risk: "Low" | "Moderate" | "High" | "Unknown";
  riskReason: string;
};

export function cashSummary(
  transactions: Transaction[],
  products: Product[],
  profile?: Profile | null,
): CashSummary {
  const settled = transactions.filter((t) => !t.is_upcoming);
  const upcoming = transactions.filter((t) => t.is_upcoming);
  const income = sum(settled.filter((t) => t.type === "income").map((t) => Number(t.amount)));
  const expenses = sum(settled.filter((t) => t.type === "expense").map((t) => Number(t.amount)));
  const upcomingExpenses = sum(
    upcoming.filter((t) => t.type === "expense").map((t) => Number(t.amount)),
  );
  const upcomingIncome = sum(
    upcoming.filter((t) => t.type === "income").map((t) => Number(t.amount)),
  );
  const opening = Number(profile?.opening_balance ?? 0);
  const balance = opening + income - expenses;
  const profit = income - expenses;
  const inventoryValue = sum(products.map((p) => Number(p.quantity) * Number(p.cost_price)));
  const potentialRevenue = sum(products.map((p) => Number(p.quantity) * Number(p.selling_price)));

  let risk: CashSummary["risk"] = "Unknown";
  let riskReason = "Add income and expenses to see a cash-flow risk reading.";
  if (transactions.length > 0) {
    const projected = balance + upcomingIncome - upcomingExpenses;
    if (projected < 0) {
      risk = "High";
      riskReason = "Upcoming costs are larger than the cash you have available.";
    } else if (expenses > 0 && projected < expenses * 0.25) {
      risk = "Moderate";
      riskReason = "Projected cash is thin compared with your recent spending.";
    } else {
      risk = "Low";
      riskReason = "Projected cash comfortably covers your recent spending.";
    }
  }

  return {
    income,
    expenses,
    upcomingExpenses,
    upcomingIncome,
    profit,
    balance,
    inventoryValue,
    potentialRevenue,
    risk,
    riskReason,
  };
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}
