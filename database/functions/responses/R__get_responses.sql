DROP FUNCTION IF EXISTS public.get_responses;

CREATE OR REPLACE FUNCTION public.get_responses(
  p_form_id uuid,
  p_respondent_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_page integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_offset integer;
  v_total_count integer;
  v_responses jsonb;
BEGIN
  IF p_form_id IS NULL THEN
    RAISE EXCEPTION 'form_id is required';
  END IF;

  v_owner_id := auth.uid();
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Missing user context';
  END IF;

  -- Ensure the user requesting responses is the owner of the form
  IF NOT EXISTS (SELECT 1 FROM public.forms WHERE id = p_form_id AND owner_id = v_owner_id) THEN
    RAISE EXCEPTION 'Unauthorized: Only the form owner can view responses';
  END IF;

  v_offset := (p_page - 1) * p_limit;

  -- Count total matching responses
  SELECT COUNT(*) INTO v_total_count
  FROM public.responses r
  WHERE r.form_id = p_form_id
    AND (p_respondent_id IS NULL OR r.submitted_by = p_respondent_id);

  -- Fetch responses with aggregated answers
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'response_id', res.id,
      'form_id', res.form_id,
      'respondent_id', res.submitted_by,
      'submitted_at', res.submitted_at,
      'ip', res.ip,
      'device', res.device,
      'metadata', res.metadata,
      'answers', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'question_id', a.question_id,
            'question_text', q.label,
            'answer_value', a.value_json
          )
        ), '[]'::jsonb)
        FROM public.answers a
        JOIN public.questions q ON q.id = a.question_id
        WHERE a.response_id = res.id
      )
    ) ORDER BY res.submitted_at DESC
  ), '[]'::jsonb)
  INTO v_responses
  FROM (
    SELECT id, form_id, submitted_by, submitted_at, ip, device, metadata
    FROM public.responses
    WHERE form_id = p_form_id
      AND (p_respondent_id IS NULL OR submitted_by = p_respondent_id)
    ORDER BY submitted_at DESC
    LIMIT p_limit
    OFFSET v_offset
  ) res;

  -- Return combined result
  RETURN jsonb_build_object(
    'responses', v_responses,
    'pagination', jsonb_build_object(
      'total', v_total_count,
      'limit', p_limit,
      'page', p_page,
      'totalPages', CEIL(v_total_count::float / NULLIF(p_limit, 0))
    )
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_responses(uuid, uuid, integer, integer) TO authenticated, anon;