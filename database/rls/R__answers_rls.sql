ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS answers_select ON public.answers;
CREATE POLICY answers_select
ON public.answers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.responses r
    JOIN public.forms f ON f.id = r.form_id
    WHERE r.id = answers.response_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS answers_insert ON public.answers;
CREATE POLICY answers_insert
ON public.answers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.responses r
    JOIN public.forms f ON f.id = r.form_id
    JOIN public.questions q ON q.id = answers.question_id AND q.form_id = f.id
    WHERE r.id = answers.response_id
      AND (
        f.status = 'published'
        OR (f.status = 'private' AND public.is_form_shared_with_current_user(f.id))
      )
  )
);

DROP POLICY IF EXISTS answers_update ON public.answers;
CREATE POLICY answers_update
ON public.answers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.responses r
    JOIN public.forms f ON f.id = r.form_id
    WHERE r.id = answers.response_id
      AND f.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.responses r
    JOIN public.forms f ON f.id = r.form_id
    WHERE r.id = answers.response_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS answers_delete ON public.answers;
CREATE POLICY answers_delete
ON public.answers
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.responses r
    JOIN public.forms f ON f.id = r.form_id
    WHERE r.id = answers.response_id
      AND f.owner_id = auth.uid()
  )
);