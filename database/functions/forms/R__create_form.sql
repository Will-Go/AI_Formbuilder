DROP FUNCTION IF EXISTS public.create_form;

CREATE OR REPLACE FUNCTION public.create_form(
  p_owner_id UUID,
  p_title VARCHAR,
  p_description TEXT DEFAULT '',
  p_status VARCHAR DEFAULT 'draft',
  p_theme JSONB DEFAULT '{}'::jsonb,
  p_settings JSONB DEFAULT '{}'::jsonb
) RETURNS SETOF forms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_title VARCHAR;
  v_final_title VARCHAR;
  v_max_copy INT := 0;
  v_current_copy INT;
  v_existing_title VARCHAR;
  v_form forms;
  v_base_exists BOOLEAN := FALSE;
  v_suffix VARCHAR;
BEGIN
  -- Force status to draft regardless of input
  p_status := 'draft';
  
  -- Extract base title using regex
  v_base_title := regexp_replace(p_title, ' \(copy( \d+)?\)$', '');
  
  -- Check if base title exists
  SELECT EXISTS(
    SELECT 1 FROM forms WHERE owner_id = p_owner_id AND title = v_base_title
  ) INTO v_base_exists;
  
  IF NOT v_base_exists THEN
    v_final_title := v_base_title;
  ELSE
    -- Base title exists, find max copy number
    FOR v_existing_title IN
      SELECT title FROM forms 
      WHERE owner_id = p_owner_id 
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

  BEGIN
    -- Insert the new form
    INSERT INTO forms (
      owner_id,
      title,
      description,
      status,
      theme,
      settings
    ) VALUES (
      p_owner_id,
      v_final_title,
      p_description,
      p_status::public.form_status,
      p_theme,
      p_settings
    ) RETURNING * INTO v_form;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create form: %', SQLERRM;
  END;
  
  RETURN NEXT v_form;
END;
$$;