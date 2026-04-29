ALTER TABLE public.form_shared_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS form_shared_list_select ON public.form_shared_list;
CREATE POLICY form_shared_list_select
ON public.form_shared_list
FOR SELECT
USING (
  email = (auth.jwt() ->> 'email')::text
  OR public.is_current_user_form_owner(form_shared_list.form_id)
);

DROP POLICY IF EXISTS form_shared_list_insert ON public.form_shared_list;
CREATE POLICY form_shared_list_insert
ON public.form_shared_list
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = form_shared_list.form_id
    AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS form_shared_list_update ON public.form_shared_list;
CREATE POLICY form_shared_list_update
ON public.form_shared_list
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = form_shared_list.form_id
    AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS form_shared_list_delete ON public.form_shared_list;
CREATE POLICY form_shared_list_delete
ON public.form_shared_list
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = form_shared_list.form_id
    AND f.owner_id = auth.uid()
  )
);