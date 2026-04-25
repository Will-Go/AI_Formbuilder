ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

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

-- Row level security for form_shared_list
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

-- Row level security for ai_chat_sessions
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_chat_sessions_select ON public.ai_chat_sessions;
CREATE POLICY ai_chat_sessions_select
ON public.ai_chat_sessions
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS ai_chat_sessions_insert ON public.ai_chat_sessions;
CREATE POLICY ai_chat_sessions_insert
ON public.ai_chat_sessions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS ai_chat_sessions_update ON public.ai_chat_sessions;
CREATE POLICY ai_chat_sessions_update
ON public.ai_chat_sessions
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS ai_chat_sessions_delete ON public.ai_chat_sessions;
CREATE POLICY ai_chat_sessions_delete
ON public.ai_chat_sessions
FOR DELETE
USING (user_id = auth.uid());

-- Row level security for ai_chat_messages
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_chat_messages_select ON public.ai_chat_messages;
CREATE POLICY ai_chat_messages_select
ON public.ai_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_chat_sessions s
    WHERE s.id = ai_chat_messages.session_id
      AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS ai_chat_messages_insert ON public.ai_chat_messages;
CREATE POLICY ai_chat_messages_insert
ON public.ai_chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_chat_sessions s
    WHERE s.id = ai_chat_messages.session_id
      AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS ai_chat_messages_update ON public.ai_chat_messages;
CREATE POLICY ai_chat_messages_update
ON public.ai_chat_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ai_chat_sessions s
    WHERE s.id = ai_chat_messages.session_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_chat_sessions s
    WHERE s.id = ai_chat_messages.session_id
      AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS ai_chat_messages_delete ON public.ai_chat_messages;
CREATE POLICY ai_chat_messages_delete
ON public.ai_chat_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.ai_chat_sessions s
    WHERE s.id = ai_chat_messages.session_id
      AND s.user_id = auth.uid()
  )
);
