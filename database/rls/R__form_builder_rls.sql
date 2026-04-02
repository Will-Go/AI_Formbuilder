ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS forms_select ON public.forms;
CREATE POLICY forms_select
ON public.forms
FOR SELECT
USING (
  owner_id = auth.uid() OR status = 'published'
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

DROP POLICY IF EXISTS questions_select ON public.questions;
CREATE POLICY questions_select
ON public.questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = questions.form_id
      AND (f.owner_id = auth.uid() OR f.status = 'published')
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
      AND (f.owner_id = auth.uid() OR f.status = 'published')
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
      AND f.status = 'published'
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
      AND f.status = 'published'
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
