-- DROP FUNCTION IF EXISTS public.is_form_shared_with_current_user;
CREATE OR REPLACE FUNCTION public.is_form_shared_with_current_user(p_form_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.form_shared_list fsl
    WHERE fsl.form_id = p_form_id
      AND fsl.email = (auth.jwt() ->> 'email')::text
  );
$$;