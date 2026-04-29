DROP FUNCTION IF EXISTS public.create_ai_chat_session(uuid, uuid);
CREATE OR REPLACE FUNCTION public.create_ai_chat_session(
  p_form_id uuid,
  p_user_id uuid
) RETURNS public.ai_chat_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.ai_chat_sessions;
BEGIN
  IF p_form_id IS NULL THEN
    RAISE EXCEPTION 'form_id parameter is required';
  END IF;

  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = p_form_id
      AND f.owner_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Form not found';
  END IF;

  INSERT INTO public.ai_chat_sessions (
    form_id,
    user_id,
    name,
    is_deleted,
    last_used_at
  ) VALUES (
    p_form_id,
    p_user_id,
    'New chat',
    false,
    now()
  )
  RETURNING * INTO v_session;

  RETURN v_session;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_ai_chat_session(uuid, uuid) TO authenticated;