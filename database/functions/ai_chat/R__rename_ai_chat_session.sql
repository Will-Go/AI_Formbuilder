DROP FUNCTION IF EXISTS public.rename_ai_chat_session(uuid, uuid, text);
CREATE OR REPLACE FUNCTION public.rename_ai_chat_session(
  p_session_id uuid,
  p_user_id uuid,
  p_name text
) RETURNS public.ai_chat_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.ai_chat_sessions;
  v_name text;
BEGIN
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'session_id parameter is required';
  END IF;

  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_name := left(trim(COALESCE(p_name, '')), 80);

  IF v_name = '' THEN
    v_name := 'New chat';
  END IF;

  UPDATE public.ai_chat_sessions
  SET
    name = v_name,
    updated_at = now()
  WHERE id = p_session_id
    AND user_id = p_user_id
    AND is_deleted = false
  RETURNING * INTO v_session;

  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  RETURN v_session;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rename_ai_chat_session(uuid, uuid, text) TO authenticated;