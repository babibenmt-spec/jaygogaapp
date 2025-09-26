/*
          # [Initial Schema Setup]
          This script sets up the initial database schema for the Jay Goga Milk application. It creates tables for profiles, products, customers, and orders, and establishes the necessary security rules to ensure users can only access their own data.

          ## Query Description: This operation is safe to run on a new project. It creates the foundational structure for the application's data. It does not modify or delete any existing user data in the `auth` schema. It sets up Row Level Security to protect user data from unauthorized access.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Tables Created: `profiles`, `products`, `customers`, `daily_orders`
          - Custom Types Created: `unit_type`, `order_status`
          - Triggers Created: `on_auth_user_created` to create user profiles automatically.
          
          ## Security Implications:
          - RLS Status: Enabled on all new tables.
          - Policy Changes: Yes, policies are created to restrict data access to the data owner.
          - Auth Requirements: Policies rely on `auth.uid()` to identify the current user.
          
          ## Performance Impact:
          - Indexes: Primary keys and foreign keys are indexed by default.
          - Triggers: A single trigger is added to the `auth.users` table.
          - Estimated Impact: Low performance impact.
*/

-- 1. Custom Types
CREATE TYPE public.unit_type AS ENUM ('ml', 'L', 'gm', 'kg', 'piece');
CREATE TYPE public.order_status AS ENUM ('pending', 'delivered');

-- 2. Profiles Table
-- Stores public user data.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Comments
COMMENT ON TABLE public.profiles IS 'Stores public user data, linked to authentication.';
-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Products Table
-- Stores product information for each user.
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit public.unit_type NOT NULL,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Comments
COMMENT ON TABLE public.products IS 'Stores product information created by users.';
-- RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own products" ON public.products FOR ALL USING (auth.uid() = user_id);

-- 4. Customers Table
-- Stores customer information for each user.
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Comments
COMMENT ON TABLE public.customers IS 'Stores customer information for each user.';
-- RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own customers" ON public.customers FOR ALL USING (auth.uid() = user_id);

-- 5. Daily Orders Table
-- Stores daily order information.
CREATE TABLE public.daily_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  amount_paid NUMERIC NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  status public.order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Comments
COMMENT ON TABLE public.daily_orders IS 'Stores daily orders for each customer.';
-- RLS
ALTER TABLE public.daily_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own orders" ON public.daily_orders FOR ALL USING (auth.uid() = user_id);

-- 6. Trigger to create a profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
