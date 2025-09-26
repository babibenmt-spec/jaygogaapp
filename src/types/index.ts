export interface User {
  id: string;
  email: string;
  username: string;
}

// Corresponds to the 'profiles' table
export interface Profile {
  id: string; // Foreign key to auth.users.id
  username: string;
  created_at: string;
}

// Corresponds to the 'products' table
export interface Product {
  id: string;
  user_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: Unit;
  photo?: string;
  created_at: string;
}

// Corresponds to the 'customers' table
export interface Customer {
  id: string;
  user_id: string;
  name: string;
  address: string;
  contact_number: string;
  created_at: string;
}

// Represents an item within the 'items' JSONB array of a DailyOrder
export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: Unit;
  price: number;
  total: number;
}

// Corresponds to the 'daily_orders' table
export interface DailyOrder {
  id: string;
  user_id: string;
  customer_id: string;
  customer_name: string;
  date: string;
  items: OrderItem[]; // This is a JSONB column in the database
  total_amount: number;
  amount_paid: number;
  status: 'pending' | 'delivered';
  created_at: string;
}

export type Unit = 'ml' | 'L' | 'gm' | 'kg' | 'piece';
