export type Profile = {
  id: string;
  full_name: string | null;
  business_name: string;
  currency_code: string;
  opening_balance: number;
  low_stock_buffer: number;
  overstock_multiplier: number;
};

export type Supplier = {
  id: string;
  user_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  products_supplied: string | null;
  purchase_price: number | null;
  is_available: boolean;
  notes: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  user_id: string;
  name: string;
  sku: string | null;
  category: string;
  quantity: number;
  min_stock: number;
  cost_price: number;
  selling_price: number;
  supplier_id: string | null;
  is_available: boolean;
  notes: string | null;
  created_at: string;
};

export type GroceryItem = {
  id: string;
  user_id: string;
  name: string;
  product_id: string | null;
  supplier_id: string | null;
  quantity_needed: number;
  purchase_price: number;
  is_available: boolean;
  is_purchased: boolean;
  purchased_at: string | null;
  notes: string | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string | null;
  product_id: string | null;
  occurred_on: string;
  is_upcoming: boolean;
  created_at: string;
};
