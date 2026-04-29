DROP FUNCTION IF EXISTS public.list_ai_chat_sessions(uuid, uuid, text, text, text);
CREATE OR REPLACE FUNCTION public.list_ai_chat_sessions(
  p_form_id uuid,
  p_user_id uuid,
  p_search text DEFAULT NULL,
  p_order_by text DEFAULT 'last_used_at',
  p_order text DEFAULT 'desc'
) RETURNS SETOF public.ai_chat_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  RETURN QUERY EXECUTE format(
    'SELECT s.*
     FROM public.ai_chat_sessions s
     WHERE s.form_id = $1
       AND s.user_id = $2
       AND s.is_deleted = false
       AND ($3 IS NULL OR s.name ILIKE $4)
     ORDER BY %I %s',
    p_order_by,
    p_order
  )
  USING p_form_id, p_user_id, p_search, '%' || p_search || '%';
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_ai_chat_sessions(uuid, uuid, text, text, text) TO authenticated;