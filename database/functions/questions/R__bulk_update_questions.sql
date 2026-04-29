DROP FUNCTION IF EXISTS public.bulk_update_questions;

CREATE OR REPLACE FUNCTION public.bulk_update_questions(
  p_form_id uuid,
  p_updates jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_update jsonb;
  v_question_id uuid;
  v_current_config jsonb;
  v_config_patch jsonb;
  v_dynamic_config jsonb;
  v_next_config jsonb;
  v_options jsonb;
  v_option jsonb;
  v_option_index integer;
  v_updated_count integer;
  v_questions_payload jsonb;
BEGIN
  IF p_form_id IS NULL THEN
    RAISE EXCEPTION 'form_id parameter is required';
  END IF;

  IF p_updates IS NULL OR jsonb_typeof(p_updates) <> 'array' THEN
    RAISE EXCEPTION 'updates payload must be an array';
  END IF;

  IF jsonb_array_length(p_updates) < 1 THEN
    RAISE EXCEPTION 'updates payload must contain at least one question';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.forms f
    WHERE f.id = p_form_id
      AND f.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Form not found or access denied';
  END IF;

  FOR v_update IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    v_question_id := NULLIF(v_update->>'id', '')::uuid;

    SELECT q.config
    INTO v_current_config
    FROM public.questions q
    WHERE q.id = v_question_id
      AND q.form_id = p_form_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Question not found';
    END IF;

    UPDATE public.questions
    SET
      type = CASE
        WHEN v_update ? 'type' THEN (v_update->>'type')::public.question_type
        ELSE type
      END,
      label = CASE
        WHEN v_update ? 'label' THEN COALESCE(btrim(v_update->>'label'), '')
        ELSE label
      END,
      description = CASE
        WHEN v_update ? 'description' THEN NULLIF(btrim(v_update->>'description'), '')
        ELSE description
      END,
      required = CASE
        WHEN v_update ? 'required' THEN (v_update->>'required')::boolean
        ELSE required
      END,
      "order" = CASE
        WHEN v_update ? 'order' THEN (v_update->>'order')::integer
        ELSE "order"
      END,
      updated_at = now()
    WHERE id = v_question_id
      AND form_id = p_form_id;

    v_config_patch := COALESCE(v_update->'config', '{}'::jsonb);

    IF jsonb_typeof(v_config_patch) <> 'object' THEN
      RAISE EXCEPTION 'question config must be an object';
    END IF;

    SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
    INTO v_dynamic_config
    FROM jsonb_each(v_update)
    WHERE key NOT IN (
      'id',
      'type',
      'label',
      'description',
      'required',
      'order',
      'config',
      'options'
    );

    IF v_config_patch <> '{}'::jsonb OR v_dynamic_config <> '{}'::jsonb THEN
      v_next_config := COALESCE(v_current_config, '{}'::jsonb)
        || v_config_patch
        || v_dynamic_config;

      UPDATE public.questions
      SET config = v_next_config,
        updated_at = now()
      WHERE id = v_question_id
        AND form_id = p_form_id;
    END IF;

    IF v_update ? 'options' THEN
      v_options := COALESCE(v_update->'options', '[]'::jsonb);

      IF jsonb_typeof(v_options) <> 'array' THEN
        RAISE EXCEPTION 'question options must be an array';
      END IF;

      DELETE FROM public.options
      WHERE question_id = v_question_id;

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
    END IF;
  END LOOP;

  v_updated_count := jsonb_array_length(p_updates);

  UPDATE public.forms
  SET updated_at = now()
  WHERE id = p_form_id;

  v_questions_payload := public.get_questions(p_form_id);

  RETURN jsonb_build_object(
    'questions', v_questions_payload->'questions',
    'updatedCount', v_updated_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_update_questions(uuid, jsonb) TO authenticated;
