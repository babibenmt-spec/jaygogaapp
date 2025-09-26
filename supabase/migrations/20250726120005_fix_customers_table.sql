/*
# [Operation Name]
Drop Address and Phone Number Columns from Customers Table

## Query Description: [This operation permanently removes the 'address' and 'phone_number' columns from the 'customers' table. This is being done to resolve a "NOT NULL constraint" error that occurs when creating a new customer, as the application no longer uses these fields. This change is destructive and will delete all existing data in these two columns.]

## Metadata:
- Schema-Category: "Dangerous"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- Table: public.customers
- Columns to be dropped:
  - address
  - phone_number

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: Any indexes on the dropped columns will also be removed.
- Triggers: Unchanged
- Estimated Impact: Low. This is a metadata change that will be fast, but it requires an exclusive lock on the table during the operation.
*/
ALTER TABLE "public"."customers" DROP COLUMN IF EXISTS "address";
ALTER TABLE "public"."customers" DROP COLUMN IF EXISTS "phone_number";
