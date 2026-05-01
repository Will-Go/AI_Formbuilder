ALTER TABLE public.ai_chat_sessions
  ADD COLUMN IF NOT EXISTS session_brief text;
