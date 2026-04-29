DROP FUNCTION IF EXISTS public.create_question;

CREATE OR REPLACE FUNCTION public.create_question(
  p_form_id uuid,
  p_question jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_question_id uuid;
  v_question_type public.question_type;
  v_label text;
  v_description text;
  v_required boolean;
  v_config jsonb;
  v_options jsonb;
  v_option jsonb;
  v_option_index integer;
  v_existing_ids uuid[];
  v_current_count integer;
  v_index integer;
  v_target_order integer;
  v_question_id_at_order uuid;
  v_questions_payload jsonb;
  v_created_question jsonb;
BEGIN
  IF p_form_id IS NULL THEN
    RAISE EXCEPTION 'form_id parameter is required';
  END IF;

  IF p_question IS NULL OR jsonb_typeof(p_question) <> 'object' THEN
    RAISE EXCEPTION 'question payload is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = p_form_id
      AND f.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Form not found or access denied';
  END IF;

  v_question_type := (p_question->>'type')::public.question_type;
  v_label := COALESCE(btrim(p_question->>'label'), '');
  v_description := NULLIF(btrim(p_question->>'description'), '');
  v_required := COALESCE((p_question->>'required')::boolean, FALSE);
  v_config := COALESCE(p_question->'config', '{}'::jsonb);

  IF jsonb_typeof(v_config) <> 'object' THEN
    RAISE EXCEPTION 'question config must be an object';
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

  v_current_count := COALESCE(array_length(v_existing_ids, 1), 0);
  v_index := NULLIF(p_question->>'index', '')::integer;

  IF v_index IS NOT NULL AND v_index >= 0 AND v_index < v_current_count THEN
    v_target_order := v_index + 1;

    UPDATE public.questions
    SET "order" = "order" + 10000
    WHERE form_id = p_form_id;
  ELSE
    v_target_order := v_current_count + 1;
  END IF;

  INSERT INTO public.questions (
    id,
    form_id,
    type,
    label,
    description,
    required,
    "order",
    config
  )
  VALUES (
    COALESCE(NULLIF(p_question->>'id', '')::uuid, gen_random_uuid()),
    p_form_id,
    v_question_type,
    v_label,
    v_description,
    v_required,
    v_target_order,
    v_config
  )
  RETURNING id INTO v_question_id;

  IF v_index IS NOT NULL AND v_index >= 0 AND v_index < v_current_count THEN
    v_option_index := 1;

    FOREACH v_question_id_at_order IN ARRAY v_existing_ids
    LOOP
      IF v_option_index = v_target_order THEN
        v_option_index := v_option_index + 1;
      END IF;

      UPDATE public.questions
      SET "order" = v_option_index
      WHERE id = v_question_id_at_order
        AND form_id = p_form_id;

      v_option_index := v_option_index + 1;
    END LOOP;
  END IF;

  IF p_question ? 'options' THEN
    v_options := COALESCE(p_question->'options', '[]'::jsonb);
  ELSIF v_question_type IN ('multiple_choice', 'checkbox', 'dropdown') THEN
    v_options := '[{"value":"Option 1","label":"Option 1","order":0}]'::jsonb;
  ELSE
    v_options := '[]'::jsonb;
  END IF;

  IF jsonb_typeof(v_options) <> 'array' THEN
    RAISE EXCEPTION 'question options must be an array';
  END IF;

  v_option_index := 0;
  FOR v_option IN SELECT * FROM jsonb_array_elements(v_options)
  LOOP
    INSERT INTO public.options (
      id,
      question_id,
      value,
      label,
      "order"
    )
    VALUES (
      COALESCE(NULLIF(v_option->>'id', '')::uuid, gen_random_uuid()),
      v_question_id,
      btrim(v_option->>'value'),
      COALESCE(btrim(v_option->>'label'), ''),
      COALESCE(NULLIF(v_option->>'order', '')::integer, v_option_index)
    );

    v_option_index := v_option_index + 1;
  END LOOP;

  UPDATE public.forms
  SET updated_at = now()
  WHERE id = p_form_id;

  v_questions_payload := public.get_questions(p_form_id);

  SELECT question
  INTO v_created_question
  FROM jsonb_array_elements(v_questions_payload->'questions') AS question
  WHERE question->>'id' = v_question_id::text
  LIMIT 1;

  RETURN jsonb_build_object(
    'question', v_created_question,
    'questions', v_questions_payload->'questions'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_question(uuid, jsonb) TO authenticated;
