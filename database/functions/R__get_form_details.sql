-- Function to retrieve full form details including questions and options in a hierarchical JSON structure
-- Accepts: p_form_id (UUID)
-- Returns: JSONB object with form metadata, questions array, and options array within each question
DROP FUNCTION IF EXISTS public.get_form_details;
CREATE OR REPLACE FUNCTION public.get_form_details(p_form_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Input Validation: Ensure form_id is not null
  IF p_form_id IS NULL THEN
    RAISE EXCEPTION 'form_id parameter is required';
  END IF;

  -- Check if the form exists and retrieve its details
  SELECT jsonb_build_object(
    'id', f.id,
    'title', f.title,
    'description', f.description,
    'status', f.status,
    'authorId', f.owner_id,
    'createdAt', f.created_at,
    'updatedAt', f.updated_at,
    'theme', f.theme,
    'settings', f.settings,
    'questions', (
      -- Subquery to aggregate questions into an array
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
              -- Nested subquery to aggregate options for each question
              SELECT COALESCE(
                jsonb_agg(
                  jsonb_build_object(
                    'id', o.id,
                    'value', o.value,
                    'label', o.label,
                    'order', o."order"
                  ) ORDER BY o."order" ASC
                ),
                '[]'::jsonb
              )
              FROM public.options o
              WHERE o.question_id = q.id
            )
          ) || q.config ORDER BY q."order" ASC
        ),
        '[]'::jsonb
      )
      FROM public.questions q
      WHERE q.form_id = f.id
    )
  )
  INTO v_result
  FROM public.forms f
  WHERE f.id = p_form_id;

  -- Error Handling: If no form was found, raise an exception
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Form with ID % not found', p_form_id;
  END IF;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the exception to be handled by the caller
    RAISE;
END;
$$;

-- Grant permissions (optional, adjust based on security model)
GRANT EXECUTE ON FUNCTION public.get_form_details(uuid) TO authenticated, anon;
