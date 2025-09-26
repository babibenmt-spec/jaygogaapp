--
-- Create custom types for units and order statuses for data consistency.
--
CREATE TYPE public.unit_type AS ENUM ('ml', 'L', 'gm', 'kg', 'piece');
CREATE TYPE public.order_status_type AS ENUM ('pending', 'delivered');

--
-- Create a table for public user profiles
--
/*
# Create profiles Table
This table stores public-facing user data. It is linked one-to-one with the `auth.users` table.

## Query Description: This operation creates a new `profiles` table to hold user profile information that is safe to be publicly exposed. It is designed to work with Supabase's authentication system by linking each profile to a user in `auth.users`. A trigger is also set up to automatically create a profile for each new user.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.profiles`
- Columns: `id` (UUID, PK), `username` (TEXT), `updated_at` (TIMESTAMPTZ)
- Foreign Keys: `id` references `auth.users.id`

## Security Implications:
- RLS Status: Enabled. Policies will be added to restrict access.
- Policy Changes: No
- Auth Requirements: User authentication is required to interact with this table.

## Performance Impact:
- Indexes: Primary key on `id`.
- Triggers: An `on_auth_user_created` trigger will be added.
- Estimated Impact: Negligible performance impact on user creation.
*/
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username text,
    updated_at timestamptz
);
COMMENT ON TABLE public.profiles IS 'Public user profile information, linked to auth.users.';

--
-- Create a table for products
--
/*
# Create products Table
This table stores the products created by users.

## Query Description: This operation creates the `products` table. Each product is linked to a user via the `user_id` field. Row Level Security will be enabled to ensure users can only access their own products.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.products`
- Columns: `id`, `user_id`, `name`, `price`, `quantity`, `unit`, `photo`, `created_at`
- Foreign Keys: `user_id` references `auth.users.id`

## Security Implications:
- RLS Status: Enabled. Policies will be added.
- Policy Changes: No
- Auth Requirements: User authentication required.

## Performance Impact:
- Indexes: Primary key on `id` and a foreign key index on `user_id`.
- Triggers: None.
- Estimated Impact: Low.
*/
CREATE TABLE public.products (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    name text NOT NULL,
    price numeric NOT NULL,
    quantity numeric NOT NULL,
    unit public.unit_type NOT NULL,
    photo text,
    created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.products IS 'Stores product information for each user.';

--
-- Create a table for customers
--
/*
# Create customers Table
This table stores customer information for each user.

## Query Description: This operation creates the `customers` table. Each customer is linked to a user via the `user_id` field. Row Level Security will ensure data privacy.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.customers`
- Columns: `id`, `user_id`, `name`, `address`, `contact_number`, `created_at`
- Foreign Keys: `user_id` references `auth.users.id`

## Security Implications:
- RLS Status: Enabled. Policies will be added.
- Policy Changes: No
- Auth Requirements: User authentication required.

## Performance Impact:
- Indexes: Primary key on `id` and a foreign key index on `user_id`.
- Triggers: None.
- Estimated Impact: Low.
*/
CREATE TABLE public.customers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    name text NOT NULL,
    address text,
    contact_number text,
    created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.customers IS 'Stores customer information for each user.';

--
-- Create a table for orders
--
/*
# Create orders Table
This table stores order information.

## Query Description: This operation creates the `orders` table. Each order is linked to a user and a customer. Deleting a customer will also delete their associated orders.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.orders`
- Columns: `id`, `user_id`, `customer_id`, `date`, `total_amount`, `amount_paid`, `status`, `created_at`
- Foreign Keys: `user_id` references `auth.users.id`, `customer_id` references `customers.id`

## Security Implications:
- RLS Status: Enabled. Policies will be added.
- Policy Changes: No
- Auth Requirements: User authentication required.

## Performance Impact:
- Indexes: Primary key on `id`, foreign key indexes on `user_id` and `customer_id`.
- Triggers: None.
- Estimated Impact: Low.
*/
CREATE TABLE public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.customers ON DELETE CASCADE,
    date date NOT NULL,
    total_amount numeric NOT NULL,
    amount_paid numeric NOT NULL DEFAULT 0,
    status public.order_status_type NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.orders IS 'Stores order details for each customer.';

--
-- Create a table for order items
--
/*
# Create order_items Table
This table links products to orders in a many-to-many relationship.

## Query Description: This operation creates the `order_items` table. It stores the individual items within each order. If a product is deleted, the `product_id` in historical orders is set to NULL to preserve order history.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.order_items`
- Columns: `id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit`, `price`, `total`
- Foreign Keys: `order_id` references `orders.id`, `product_id` references `products.id`

## Security Implications:
- RLS Status: Enabled. Policies will be added based on the parent order's user.
- Policy Changes: No
- Auth Requirements: User authentication required.

## Performance Impact:
- Indexes: Primary key on `id`, foreign key indexes on `order_id` and `product_id`.
- Triggers: None.
- Estimated Impact: Low.
*/
CREATE TABLE public.order_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders ON DELETE CASCADE,
    product_id uuid REFERENCES public.products ON DELETE SET NULL,
    product_name text NOT NULL,
    quantity numeric NOT NULL,
    unit public.unit_type NOT NULL,
    price numeric NOT NULL,
    total numeric NOT NULL
);
COMMENT ON TABLE public.order_items IS 'Stores individual items for each order.';

--
-- Set up Row Level Security (RLS)
--
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- RLS Policies for profiles
--
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

--
-- RLS Policies for user-specific tables
--
CREATE POLICY "Users can manage their own products." ON public.products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own customers." ON public.customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own orders." ON public.orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage items in their own orders." ON public.order_items FOR ALL
    USING (
        (
            SELECT user_id
            FROM public.orders
            WHERE id = order_items.order_id
        ) = auth.uid()
    );

--
-- Function and Trigger to create a public profile for each new user
--
/*
# Create handle_new_user Function and Trigger
This function automatically creates a new profile entry when a new user signs up.

## Query Description: This operation creates a PostgreSQL function `handle_new_user` that inserts a new row into `public.profiles`. It also creates a trigger `on_auth_user_created` that calls this function after a new user is inserted into `auth.users`. This automates profile creation.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Security Implications:
- RLS Status: Not applicable to function/trigger.
- Policy Changes: No.
- Auth Requirements: The trigger runs with the permissions of the `supabase_auth_admin` role.

## Performance Impact:
- Indexes: None.
- Triggers: Adds a trigger to the `auth.users` table.
- Estimated Impact: Negligible overhead on user sign-up.
*/
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

--
-- Function to get username from profiles table
--
CREATE OR REPLACE FUNCTION public.get_username(user_id uuid)
RETURNS text AS $$
DECLARE
  username text;
BEGIN
  SELECT p.username INTO username
  FROM public.profiles p
  WHERE p.id = user_id;
  RETURN username;
END;
$$ LANGUAGE plpgsql;
