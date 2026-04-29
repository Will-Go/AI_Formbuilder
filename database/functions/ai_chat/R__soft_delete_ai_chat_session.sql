DROP FUNCTION IF EXISTS public.soft_delete_ai_chat_session(uuid, uuid);
CREATE OR REPLACE FUNCTION public.soft_delete_ai_chat_session(
  p_session_id uuid,
  p_user_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_form_id uuid;
BEGIN
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'session_id parameter is required';
  END IF;

  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.ai_chat_sessions
  SET
    is_deleted = true,
    updated_at = now()
  WHERE id = p_session_id
    AND user_id = p_user_id
    AND is_deleted = false
  RETURNING form_id INTO v_form_id;

  IF v_form_id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  RETURN v_form_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_ai_chat_session(uuid, uuid) TO authenticated;