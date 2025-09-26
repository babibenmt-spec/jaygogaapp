/*
# [Operation Name] Secure Functions
[This operation hardens the security of existing database functions by explicitly setting the search_path. This mitigates the risk of certain attack vectors, as highlighted by the security advisories.]

## Query Description: [This operation alters two existing functions, `handle_new_user` and `get_user_id`, to set a fixed `search_path`. This change has no impact on existing data and is a preventative security enhancement. It ensures that the functions resolve objects from the `public` schema, preventing potential hijacking.]

## Metadata:
- Schema-Category: ["Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Functions affected: `handle_new_user`, `get_user_id`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Not Applicable]
- Mitigates: [Function search path vulnerabilities]

## Performance Impact:
- Indexes: [Not Applicable]
- Triggers: [Not Applicable]
- Estimated Impact: [None. This is a security configuration change with no performance overhead.]
*/

ALTER FUNCTION public.handle_new_user()
SET search_path = 'public';

ALTER FUNCTION public.get_user_id()
SET search_path = 'public';
