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