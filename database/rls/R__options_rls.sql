ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS options_select ON public.options;
CREATE POLICY options_select
ON public.options
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.questions q
    JOIN public.forms f ON f.id = q.form_id
    WHERE q.id = options.question_id
      AND (
        f.owner_id = auth.uid() 
        OR f.status = 'published'
        OR (f.status = 'private' AND public.is_form_shared_with_current_user(f.id))
      )
  )
);

DROP POLICY IF EXISTS options_insert ON public.options;
CREATE POLICY options_insert
ON public.options
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.questions q
    JOIN public.forms f ON f.id = q.form_id
    WHERE q.id = options.question_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS options_update ON public.options;
CREATE POLICY options_update
ON public.options
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.questions q
    JOIN public.forms f ON f.id = q.form_id
    WHERE q.id = options.question_id
      AND f.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.questions q
    JOIN public.forms f ON f.id = q.form_id
    WHERE q.id = options.question_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS options_delete ON public.options;
CREATE POLICY options_delete
ON public.options
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.questions q
    JOIN public.forms f ON f.id = q.form_id
    WHERE q.id = options.question_id
      AND f.owner_id = auth.uid()
  )
);