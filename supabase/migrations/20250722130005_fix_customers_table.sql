/*
          # [Operation Name]
          Fix Customers Table Schema

          ## Query Description: This operation permanently removes the 'address' and 'phone_number' columns from the 'customers' table to align the database schema with the application's code. This will resolve the "violates not-null constraint" error when adding new customers. Any data currently in these columns will be permanently deleted.

          ## Metadata:
          - Schema-Category: "Dangerous"
          - Impact-Level: "High"
          - Requires-Backup: true
          - Reversible: false
          
          ## Structure Details:
          - Table: public.customers
          - Columns Removed: address, phone_number
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: Admin privileges required to run this migration.
          
          ## Performance Impact:
          - Indexes: Any indexes on the removed columns will also be dropped.
          - Triggers: Unchanged
          - Estimated Impact: Low performance impact unless the table is extremely large.
          */

ALTER TABLE public.customers
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS phone_number;
