DROP FUNCTION IF EXISTS public.reorder_questions;

CREATE OR REPLACE FUNCTION public.reorder_questions(
  p_form_id uuid,
  p_question_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_ids uuid[];
  v_existing_count integer;
  v_input_count integer;
  v_question_id uuid;
  v_index integer;
  v_questions_payload jsonb;
BEGIN
  IF p_form_id IS NULL THEN
    RAISE EXCEPTION 'form_id parameter is required';
  END IF;

  IF p_question_ids IS NULL OR array_length(p_question_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'questionIds must contain all form questions';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = p_form_id
      AND f.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Form not found or access denied';
  END IF;

  SELECT COALESCE(array_agg(locked_questions.id), ARRAY[]::uuid[])
  INTO v_existing_ids
  FROM (
    SELECT q.id
    FROM public.questions q
    WHERE q.form_id = p_form_id
    ORDER BY q."order" ASC
    FOR UPDATE
  ) locked_questions;

  v_existing_count := COALESCE(array_length(v_existing_ids, 1), 0);
  v_input_count := COALESCE(array_length(p_question_ids, 1), 0);

  IF v_existing_count <> v_input_count THEN
    RAISE EXCEPTION 'questionIds must contain all form questions';
  END IF;

  IF (
    SELECT count(DISTINCT input_id)
    FROM unnest(p_question_ids) AS input_ids(input_id)
  ) <> v_input_count THEN
    RAISE EXCEPTION 'questionIds contains duplicate question IDs';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(p_question_ids) AS input_ids(input_id)
    WHERE NOT input_id = ANY(v_existing_ids)
  ) THEN
    RAISE EXCEPTION 'questionIds contains unknown question IDs';
  END IF;

  UPDATE public.questions
  SET "order" = "order" + 10000
  WHERE form_id = p_form_id;

  v_index := 1;
  FOREACH v_question_id IN ARRAY p_question_ids
  LOOP
    UPDATE public.questions
    SET "order" = v_index
    WHERE id = v_question_id
      AND form_id = p_form_id;

    v_index := v_index + 1;
  END LOOP;

  UPDATE public.forms
  SET updated_at = now()
  WHERE id = p_form_id;

  v_questions_payload := public.get_questions(p_form_id);

  RETURN jsonb_build_object(
    'questions', v_questions_payload->'questions'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reorder_questions(uuid, uuid[]) TO authenticated;
