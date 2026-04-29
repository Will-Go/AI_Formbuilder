ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS questions_select ON public.questions;
CREATE POLICY questions_select
ON public.questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = questions.form_id
      AND (
        f.owner_id = auth.uid() 
        OR f.status = 'published'
        OR (f.status = 'private' AND public.is_form_shared_with_current_user(f.id))
      )
  )
);

DROP POLICY IF EXISTS questions_insert ON public.questions;
CREATE POLICY questions_insert
ON public.questions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = questions.form_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS questions_update ON public.questions;
CREATE POLICY questions_update
ON public.questions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = questions.form_id
      AND f.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = questions.form_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS questions_delete ON public.questions;
CREATE POLICY questions_delete
ON public.questions
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = questions.form_id
      AND f.owner_id = auth.uid()
  )
);