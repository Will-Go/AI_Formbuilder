DROP FUNCTION IF EXISTS public.get_questions;

CREATE OR REPLACE FUNCTION public.get_questions(p_form_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_questions jsonb;
BEGIN
  IF p_form_id IS NULL THEN
    RAISE EXCEPTION 'form_id parameter is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = p_form_id
      AND f.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Form not found or access denied';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'type', q.type,
        'label', q.label,
        'description', q.description,
        'required', q.required,
        'order', q."order",
        'options', (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', o.id,
                'value', o.value,
                'label', o.label,
                'order', o."order"
              )
              ORDER BY o."order" ASC
            ),
            '[]'::jsonb
          )
          FROM public.options o
          WHERE o.question_id = q.id
        )
      ) || q.config
      ORDER BY q."order" ASC
    ),
    '[]'::jsonb
  )
  INTO v_questions
  FROM public.questions q
  WHERE q.form_id = p_form_id;

  RETURN jsonb_build_object(
    'questions', v_questions,
    'count', jsonb_array_length(v_questions)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_questions(uuid) TO authenticated;
