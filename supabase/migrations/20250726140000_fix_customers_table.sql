/*
# [Operation Name]
Fix Customers Table Schema

## Query Description: [This operation will permanently remove the 'address' and 'phone_number' columns from the 'customers' table. This is being done to resolve a "not-null constraint" error that occurs when creating a new customer, which indicates the database schema is out of sync with the application's code. This change is destructive and will delete all data currently stored in these two columns.]

## Metadata:
- Schema-Category: "Dangerous"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- Table: public.customers
- Columns being removed:
  - address
  - phone_number

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low. The operation will be fast on tables of small to medium size.
*/

ALTER TABLE public.customers
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS phone_number;
