DROP FUNCTION IF EXISTS public.get_response_summary;

CREATE OR REPLACE FUNCTION public.get_response_summary(p_form_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_summary jsonb;
BEGIN
  IF p_form_id IS NULL THEN
    RAISE EXCEPTION 'form_id is required';
  END IF;

  v_owner_id := auth.uid();
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Missing user context';
  END IF;

  -- Ensure the user requesting summary is the owner of the form
  IF NOT EXISTS (SELECT 1 FROM public.forms WHERE id = p_form_id AND owner_id = v_owner_id) THEN
    RAISE EXCEPTION 'Unauthorized: Only the form owner can view responses';
  END IF;

  WITH question_data AS (
    SELECT
      q.id AS question_id,
      q.label,
      q.description,
      q.required,
      q."order",
      q.type,
      q.config,
      -- Fetch options to map values to labels
      COALESCE((
        SELECT jsonb_object_agg(o.value, o.label)
        FROM public.options o
        WHERE o.question_id = q.id
      ), '{}'::jsonb) as option_map
    FROM public.questions q
    WHERE q.form_id = p_form_id
      AND q.type NOT IN ('section_divider', 'paragraph')
  ),
  aggregated_answers AS (
    SELECT
      qd.question_id,
      qd.label,
      qd.description,
      qd.required,
      qd."order",
      CASE
        WHEN qd.type IN ('multiple_choice', 'dropdown', 'yes_no') THEN 'pie'
        WHEN qd.type IN ('checkbox', 'rating', 'linear_scale', 'number', 'date') THEN 'bar'
        ELSE 'text'
      END AS chart_type,
      qd.type as q_type,
      qd.option_map,
      -- Aggregate answers based on type
      CASE
        WHEN qd.type IN ('multiple_choice', 'dropdown', 'yes_no', 'rating', 'linear_scale', 'number', 'date') THEN
          (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
              'label', COALESCE(qd.option_map->>a.val, a.val),
              'count', a.count_val
            )), '[]'::jsonb)
            FROM (
              SELECT value_json#>>'{}' as val, count(*) as count_val
              FROM public.answers ans
              JOIN public.responses res ON res.id = ans.response_id
              WHERE ans.question_id = qd.question_id AND res.form_id = p_form_id
              GROUP BY val
              ORDER BY count_val DESC
            ) a
            WHERE a.val IS NOT NULL AND a.val != ''
          )
        WHEN qd.type = 'checkbox' THEN
          (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
              'label', COALESCE(qd.option_map->>a.val, a.val),
              'count', a.count_val
            )), '[]'::jsonb)
            FROM (
              SELECT jsonb_array_elements_text(ans.value_json) as val, count(*) as count_val
              FROM public.answers ans
              JOIN public.responses res ON res.id = ans.response_id
              WHERE ans.question_id = qd.question_id AND res.form_id = p_form_id
                AND jsonb_typeof(ans.value_json) = 'array'
              GROUP BY val
              ORDER BY count_val DESC
            ) a
          )
        WHEN qd.type IN ('email', 'phone', 'short_text') THEN
          -- Exact match counting for fields that shouldn't be word-split
          (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
              'word', a.val,
              'count', a.count_val
            )), '[]'::jsonb)
            FROM (
              SELECT ans.value_json#>>'{}' as val, count(*) as count_val
              FROM public.answers ans
              JOIN public.responses res ON res.id = ans.response_id
              WHERE ans.question_id = qd.question_id AND res.form_id = p_form_id
                AND ans.value_json#>>'{}' IS NOT NULL
              GROUP BY val
              ORDER BY count_val DESC
              LIMIT 20
            ) a
            WHERE a.val != ''
          )
        ELSE
          -- Text types: word frequency (basic) for long text
          (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
              'word', a.word,
              'count', a.count_val
            )), '[]'::jsonb)
            FROM (
              SELECT word_table.word as word, count(*) as count_val
              FROM public.answers ans
              JOIN public.responses res ON res.id = ans.response_id
              CROSS JOIN LATERAL regexp_split_to_table(lower(ans.value_json#>>'{}'), '\W+') AS word_table(word)
              WHERE ans.question_id = qd.question_id AND res.form_id = p_form_id
                AND ans.value_json#>>'{}' IS NOT NULL
                AND length(word_table.word) > 2
              GROUP BY word_table.word
              ORDER BY count_val DESC
              LIMIT 20
            ) a
            WHERE a.word != ''
          )
      END AS data
    FROM question_data qd
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', question_id,
      'label', label,
      'description', description,
      'required', required,
      'order', "order",
      'chart_type', chart_type,
      'type', q_type,
      'data', data
    ) ORDER BY "order" ASC
  ), '[]'::jsonb)
  INTO v_summary
  FROM aggregated_answers;

  RETURN jsonb_build_object(
    'summary', v_summary,
    'total_responses', (SELECT count(*) FROM public.responses WHERE form_id = p_form_id)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_response_summary(uuid) TO authenticated, anon;
