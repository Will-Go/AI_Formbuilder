-- DROP FUNCTION IF EXISTS public.is_current_user_form_owner;
CREATE OR REPLACE FUNCTION public.is_current_user_form_owner(p_form_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = p_form_id
      AND f.owner_id = auth.uid()
  );
$$;