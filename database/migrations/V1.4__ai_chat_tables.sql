-- AI Chat Sessions: one session per (form, user)
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id     uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_form_user
  ON public.ai_chat_sessions(form_id, user_id);

-- AI Chat Messages: messages within a session
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text NOT NULL,
  -- metadata stores staged changes array as JSONB
  -- shape: Array<{ id, type, questionId?, payload, accepted }>
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id
  ON public.ai_chat_messages(session_id, created_at);
