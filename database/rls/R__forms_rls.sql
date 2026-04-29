ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS forms_select ON public.forms;
CREATE POLICY forms_select
ON public.forms
FOR SELECT
USING (
  owner_id = auth.uid() 
  OR status = 'published'
  OR (status = 'private' AND public.is_form_shared_with_current_user(id))
);

DROP POLICY IF EXISTS forms_insert ON public.forms;
CREATE POLICY forms_insert
ON public.forms
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND owner_id = auth.uid()
);

DROP POLICY IF EXISTS forms_update ON public.forms;
CREATE POLICY forms_update
ON public.forms
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS forms_delete ON public.forms;
CREATE POLICY forms_delete
ON public.forms
FOR DELETE
USING (owner_id = auth.uid());