/*
          # [Consolidated Initial Schema]
          This script creates the complete initial database schema for the application, including tables for profiles, products, customers, and daily orders. It also sets up Row Level Security (RLS) and a trigger to automatically create user profiles upon registration. This version of the schema permanently removes the 'address' and 'contact_number' fields from the 'customers' table as requested.

          ## Query Description: This is a foundational script. If you have existing data, running this may cause conflicts. It is intended for a fresh database setup or to correct a failed initial migration. It will create all necessary tables and security policies. No data will be lost if the tables do not already exist.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "High"
          - Requires-Backup: true
          - Reversible: false
          
          ## Structure Details:
          - Creates tables: public.profiles, public.products, public.customers, public.daily_orders.
          - Creates function: public.handle_new_user.
          - Creates trigger: on_auth_user_created.
          - Enables RLS on all new tables.
          - Defines RLS policies for user-specific data access.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes, defines all initial policies.
          - Auth Requirements: Policies are based on 'auth.uid()'.
          
          ## Performance Impact:
          - Indexes: Adds primary keys and foreign keys, which are indexed.
          - Triggers: Adds one trigger on the 'auth.users' table.
          - Estimated Impact: Low, standard setup for a new application.
          */

-- 1. PROFILES TABLE
-- Stores public user data.
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    username TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
COMMENT ON TABLE public.profiles IS 'Stores public user data, linked to auth.users.';

-- 2. HANDLE NEW USER FUNCTION
-- This trigger automatically creates a profile entry when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a new user profile upon registration.';

-- 3. NEW USER TRIGGER
-- Attaches the function to the auth.users table.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. PRODUCTS TABLE
-- Stores product information.
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    photo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own products." ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add their own products." ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products." ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products." ON public.products FOR DELETE USING (auth.uid() = user_id);
COMMENT ON TABLE public.products IS 'Stores product information for each user.';

-- 5. CUSTOMERS TABLE
-- Stores customer information. 'address' and 'contact_number' are removed.
CREATE TABLE public.customers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own customers." ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add their own customers." ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own customers." ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own customers." ON public.customers FOR DELETE USING (auth.uid() = user_id);
COMMENT ON TABLE public.customers IS 'Stores customer information for each user, without address or contact.';

-- 6. DAILY ORDERS TABLE
-- Stores daily order records.
CREATE TABLE public.daily_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    date DATE NOT NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.daily_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orders." ON public.daily_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add their own orders." ON public.daily_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders." ON public.daily_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own orders." ON public.daily_orders FOR DELETE USING (auth.uid() = user_id);
COMMENT ON TABLE public.daily_orders IS 'Stores daily order records for each user.';
