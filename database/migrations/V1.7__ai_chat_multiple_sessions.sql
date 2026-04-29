ALTER TABLE public.ai_chat_sessions
  DROP CONSTRAINT IF EXISTS ai_chat_sessions_form_id_user_id_key;

ALTER TABLE public.ai_chat_sessions
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'New chat',
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz NOT NULL DEFAULT now();

UPDATE public.ai_chat_sessions
SET
  name = COALESCE(NULLIF(name, ''), 'Conversation'),
  is_deleted = COALESCE(is_deleted, false),
  last_used_at = COALESCE(last_used_at, updated_at, created_at, now());

DROP INDEX IF EXISTS idx_ai_chat_sessions_form_user;

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_form_user_active_last_used
  ON public.ai_chat_sessions(form_id, user_id, is_deleted, last_used_at DESC);
