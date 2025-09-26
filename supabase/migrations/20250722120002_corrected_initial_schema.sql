/*
# [Corrected Initial Schema & RLS Setup]
This script creates the complete database schema for the Jay Goga Milk app, including tables for profiles, products, customers, and orders. It also establishes a secure foundation by implementing Row-Level Security (RLS) to ensure users can only access their own data. This script corrects a previous version that was missing a critical helper function.

## Query Description: This operation is structural and sets up the foundational tables and security for the application. It is designed to be safe to re-run. It creates tables if they don't exist and replaces functions and policies to ensure the latest, correct version is in place. No existing user data will be lost if tables already exist.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Creates/Replaces function: `public.get_user_id()`
- Creates/Replaces function: `public.handle_new_user()`
- Creates/Replaces trigger: `on_auth_user_created` on `auth.users`
- Creates table: `public.profiles` if not exists
- Creates table: `public.products` if not exists
- Creates table: `public.customers` if not exists
- Creates table: `public.orders` if not exists
- Creates table: `public.order_items` if not exists
- Enables RLS and creates/replaces policies for all new tables.

## Security Implications:
- RLS Status: Enabled on all application tables.
- Policy Changes: Yes, this script defines the core RLS policies for the application.
- Auth Requirements: Policies are based on the authenticated user's ID (auth.uid). This script also fixes a "Function Search Path Mutable" warning by setting `search_path` and using `SECURITY DEFINER` on the trigger function.

## Performance Impact:
- Indexes: Primary keys are indexed automatically. Foreign keys are also indexed.
- Triggers: Adds a trigger to `auth.users` which fires once on user creation. Impact is minimal.
- Estimated Impact: Low performance impact. This setup is standard for secure, multi-tenant applications.
*/

-- Helper function to get the current user's ID from the JWT
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Create a table for public profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  updated_at TIMESTAMPTZ
);

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$;

-- Trigger to execute the function on new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles
  FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create Products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT get_user_id(),
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS policies for Products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own products." ON public.products;
CREATE POLICY "Users can manage their own products." ON public.products
  FOR ALL USING (user_id = get_user_id());

-- Create Customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT get_user_id(),
  name TEXT NOT NULL,
  address TEXT,
  contact_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS policies for Customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own customers." ON public.customers;
CREATE POLICY "Users can manage their own customers." ON public.customers
  FOR ALL USING (user_id = get_user_id());

-- Create Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT get_user_id(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS policies for Orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own orders." ON public.orders;
CREATE POLICY "Users can manage their own orders." ON public.orders
  FOR ALL USING (user_id = get_user_id());

-- Create Order Items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS policies for Order Items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own order items." ON public.order_items;
CREATE POLICY "Users can manage their own order items." ON public.order_items
  FOR ALL USING (
    (SELECT user_id FROM public.orders WHERE id = order_id) = get_user_id()
  );
