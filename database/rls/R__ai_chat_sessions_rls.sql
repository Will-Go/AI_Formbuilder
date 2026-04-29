ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_chat_sessions_select ON public.ai_chat_sessions;
CREATE POLICY ai_chat_sessions_select
ON public.ai_chat_sessions
FOR SELECT
USING (user_id = auth.uid() AND is_deleted = false);

DROP POLICY IF EXISTS ai_chat_sessions_insert ON public.ai_chat_sessions;
CREATE POLICY ai_chat_sessions_insert
ON public.ai_chat_sessions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND is_deleted = false
);

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