DROP FUNCTION IF EXISTS public.copy_form;

CREATE OR REPLACE FUNCTION public.copy_form(
  p_original_form_id UUID,
  p_user_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_original_form RECORD;
  v_new_form_id UUID;
  v_base_title VARCHAR;
  v_final_title VARCHAR;
  v_max_copy INT := 0;
  v_current_copy INT;
  v_existing_title VARCHAR;
  v_base_exists BOOLEAN := FALSE;
  v_suffix VARCHAR;
  v_question RECORD;
  v_new_question_id UUID;
  v_option RECORD;
BEGIN
  -- 1. Find original form
  SELECT * INTO v_original_form FROM forms WHERE id = p_original_form_id AND owner_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Original form not found or access denied';
  END IF;

  -- 2. Calculate new title
  v_base_title := regexp_replace(v_original_form.title, ' \(copy( \d+)?\)$', '');
  
  SELECT EXISTS(
    SELECT 1 FROM forms WHERE owner_id = p_user_id AND title = v_base_title
  ) INTO v_base_exists;
  
  IF NOT v_base_exists THEN
    v_final_title := v_base_title || ' (copy)';
  ELSE
    FOR v_existing_title IN
      SELECT title FROM forms 
      WHERE owner_id = p_user_id 
        AND title LIKE v_base_title || ' (copy%'
    LOOP
      IF v_existing_title = v_base_title || ' (copy)' THEN
        IF v_max_copy < 1 THEN v_max_copy := 1; END IF;
      ELSE
        v_suffix := substr(v_existing_title, length(v_base_title) + 9);
        v_suffix := left(v_suffix, length(v_suffix) - 1);
        
        IF v_suffix ~ '^[0-9]+$' THEN
          v_current_copy := v_suffix::INT;
          IF v_current_copy > v_max_copy THEN
            v_max_copy := v_current_copy;
          END IF;
        END IF;
      END IF;
    END LOOP;
    
    IF v_max_copy = 0 THEN
      v_final_title := v_base_title || ' (copy)';
    ELSE
      v_final_title := v_base_title || ' (copy ' || (v_max_copy + 1) || ')';
    END IF;
  END IF;

  -- 3. Insert new form
  INSERT INTO forms (
    owner_id,
    title,
    description,
    status,
    theme,
    settings
  ) VALUES (
    p_user_id,
    v_final_title,
    v_original_form.description,
    'draft',
    v_original_form.theme,
    v_original_form.settings
  ) RETURNING id INTO v_new_form_id;

  -- 4. Copy questions and options
  FOR v_question IN SELECT * FROM questions WHERE form_id = p_original_form_id ORDER BY "order"
  LOOP
    INSERT INTO questions (
      form_id,
      type,
      label,
      description,
      required,
      "order",
      config
    ) VALUES (
      v_new_form_id,
      v_question.type,
      v_question.label,
      v_question.description,
      v_question.required,
      v_question."order",
      v_question.config
    ) RETURNING id INTO v_new_question_id;

    FOR v_option IN SELECT * FROM options WHERE question_id = v_question.id ORDER BY "order"
    LOOP
      INSERT INTO options (
        question_id,
        value,
        label,
        "order"
      ) VALUES (
        v_new_question_id,
        v_option.value,
        v_option.label,
        v_option."order"
      );
    END LOOP;
  END LOOP;

  RETURN v_new_form_id;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to copy form: %', SQLERRM;
END;
$$;
