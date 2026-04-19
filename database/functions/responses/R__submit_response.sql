CREATE OR REPLACE FUNCTION public.submit_response(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_form_id uuid;
  v_respondent_id uuid;
  v_ip text;
  v_device text;
  v_metadata jsonb;
  v_answers jsonb;
  v_response_id uuid;
  v_answer jsonb;
  v_question_id uuid;
BEGIN
  -- Extract basic fields
  v_form_id := (p_payload->>'form_id')::uuid;
  v_respondent_id := NULLIF(p_payload->>'respondent_id', '')::uuid;
  v_ip := p_payload->>'ip';
  v_device := p_payload->>'device';
  v_metadata := COALESCE(p_payload->'metadata', '{}'::jsonb);
  v_answers := COALESCE(p_payload->'answers', '[]'::jsonb);

  -- Validate form_id
  IF v_form_id IS NULL THEN
    RAISE EXCEPTION 'form_id is required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.forms WHERE id = v_form_id) THEN
    RAISE EXCEPTION 'Form with ID % does not exist', v_form_id;
  END IF;

  -- Insert the response header
  INSERT INTO public.responses (form_id, submitted_by, ip, device, metadata)
  VALUES (v_form_id, v_respondent_id, v_ip, v_device, v_metadata)
  RETURNING id INTO v_response_id;

  -- Iterate through answers array and insert each row
  FOR v_answer IN SELECT * FROM jsonb_array_elements(v_answers)
  LOOP
    v_question_id := (v_answer->>'question_id')::uuid;

    -- Validate question existence and form association
    IF NOT EXISTS (SELECT 1 FROM public.questions WHERE id = v_question_id AND form_id = v_form_id) THEN
      RAISE EXCEPTION 'Question % does not belong to form %', v_question_id, v_form_id;
    END IF;

    -- Insert answer row
    INSERT INTO public.answers (response_id, question_id, value_json)
    VALUES (v_response_id, v_question_id, v_answer->'value');
  END LOOP;

  RETURN v_response_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.submit_response(jsonb) TO authenticated, anon;