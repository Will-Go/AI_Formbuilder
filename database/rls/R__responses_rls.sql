ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS responses_select ON public.responses;
CREATE POLICY responses_select
ON public.responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = responses.form_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS responses_insert ON public.responses;
CREATE POLICY responses_insert
ON public.responses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = responses.form_id
      AND (
        f.status = 'published'
        OR (f.status = 'private' AND public.is_form_shared_with_current_user(f.id))
      )
  )
);

DROP POLICY IF EXISTS responses_update ON public.responses;
CREATE POLICY responses_update
ON public.responses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = responses.form_id
      AND f.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = responses.form_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS responses_delete ON public.responses;
CREATE POLICY responses_delete
ON public.responses
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = responses.form_id
      AND f.owner_id = auth.uid()
  )
);