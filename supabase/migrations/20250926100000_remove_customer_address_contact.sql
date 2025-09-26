/*
  # [Operation Name]
  Remove Address and Contact Number from Customers

  [Description of what this operation does]
  This migration removes the `address` and `contact_number` columns from the `public.customers` table to simplify customer data management, as requested.

  ## Query Description:
  This operation will permanently delete the address and phone number columns from your customer list. All existing address and phone number data will be lost forever. This action cannot be undone. Please back up your `customers` table before running this script if this information is important.

  ## Metadata:
  - Schema-Category: "Dangerous"
  - Impact-Level: "High"
  - Requires-Backup: true
  - Reversible: false

  ## Structure Details:
  - Table affected: `public.customers`
  - Columns removed: `address`, `contact_number`

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: None

  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Low. The operation might cause a brief lock on the table during the alteration.
*/

ALTER TABLE public.customers
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS contact_number;
