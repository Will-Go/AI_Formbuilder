-- Atomically accept or reject every pending staged change on an AI chat message.
-- Returns the updated stagedChanges array plus the refreshed form payload.
DROP FUNCTION IF EXISTS public.apply_all_staged_changes;

CREATE OR REPLACE FUNCTION public.apply_all_staged_changes(
  p_session_id uuid,
  p_message_id uuid,
  p_action text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_form_id uuid;
  v_metadata jsonb;
  v_changes jsonb;
  v_change jsonb;
  v_payload jsonb;
  v_options jsonb;
  v_option jsonb;
  v_new_options jsonb;
  v_question_id uuid;
  v_change_type text;
  v_past jsonb;
  v_past_full jsonb;
  v_new_changes jsonb := '[]'::jsonb;
  v_form_updates jsonb;
  v_allowed_form_keys text[] := ARRAY['title', 'description', 'status', 'theme', 'settings'];
BEGIN
  IF p_session_id IS NULL OR p_message_id IS NULL THEN
    RAISE EXCEPTION 'session_id and message_id are required';
  END IF;

  IF p_action NOT IN ('accept', 'reject') THEN
    RAISE EXCEPTION 'p_action must be accept or reject';
  END IF;

  -- Resolve form + ownership in a single guard
  SELECT f.id
  INTO v_form_id
  FROM public.ai_chat_sessions s
  JOIN public.forms f ON f.id = s.form_id
  WHERE s.id = p_session_id
    AND s.user_id = auth.uid()
    AND f.owner_id = auth.uid();

  IF v_form_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock + load message metadata
  SELECT metadata
  INTO v_metadata
  FROM public.ai_chat_messages
  WHERE id = p_message_id
    AND session_id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  v_changes := COALESCE(v_metadata->'stagedChanges', '[]'::jsonb);

  IF jsonb_typeof(v_changes) <> 'array' THEN
    RAISE EXCEPTION 'stagedChanges must be an array';
  END IF;

  FOR v_change IN SELECT * FROM jsonb_array_elements(v_changes)
  LOOP
    -- Pass-through if already decided
    IF v_change->>'accepted' IS NOT NULL
       AND v_change->>'accepted' <> '' THEN
      v_new_changes := v_new_changes || jsonb_build_array(v_change);
      CONTINUE;
    END IF;

    v_change_type := v_change->>'type';
    v_payload := COALESCE(v_change->'payload', '{}'::jsonb);
    v_question_id := CASE
      WHEN v_change->>'questionId' ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN (v_change->>'questionId')::uuid
      ELSE NULL
    END;
    v_past := NULL;
    v_past_full := NULL;

    -- Compute "past" snapshot, mirroring client getPastValue()
    IF v_change_type IN ('update', 'delete') AND v_question_id IS NOT NULL THEN
      SELECT to_jsonb(q)
      INTO v_past_full
      FROM public.questions q
      WHERE q.id = v_question_id AND q.form_id = v_form_id;

      IF v_past_full IS NOT NULL THEN
        SELECT COALESCE(jsonb_object_agg(k, v_past_full->k), '{}'::jsonb)
        INTO v_past
        FROM jsonb_object_keys(v_payload) AS k
        WHERE v_past_full ? k;
      END IF;
    ELSIF v_change_type = 'update_form' THEN
      SELECT to_jsonb(f)
      INTO v_past_full
      FROM public.forms f
      WHERE f.id = v_form_id;

      IF v_past_full IS NOT NULL THEN
        SELECT COALESCE(jsonb_object_agg(k, v_past_full->k), '{}'::jsonb)
        INTO v_past
        FROM jsonb_object_keys(v_payload) AS k
        WHERE v_past_full ? k;
      END IF;
    END IF;

    IF p_action = 'accept' THEN
      IF v_change_type = 'add' THEN
        v_payload := v_payload - 'id' - 'questionId';

        IF v_payload ? 'options' AND jsonb_typeof(v_payload->'options') = 'array' THEN
          v_new_options := '[]'::jsonb;
          FOR v_option IN SELECT * FROM jsonb_array_elements(v_payload->'options')
          LOOP
            v_new_options := v_new_options || jsonb_build_array(
              v_option || jsonb_build_object('id', gen_random_uuid()::text)
            );
          END LOOP;
          v_payload := jsonb_set(v_payload, '{options}', v_new_options);
        END IF;

        -- create_question reads "index" for positioning; mirror client mapping order -> index
        IF v_payload ? 'order' AND NOT v_payload ? 'index' THEN
          v_payload := v_payload || jsonb_build_object('index', v_payload->'order');
        END IF;

        PERFORM public.create_question(v_form_id, v_payload);

      ELSIF v_change_type = 'update' THEN
        IF v_question_id IS NULL THEN
          RAISE EXCEPTION 'questionId required for update change';
        END IF;

        v_payload := v_payload - 'id';

        IF v_payload ? 'options' AND jsonb_typeof(v_payload->'options') = 'array' THEN
          v_new_options := '[]'::jsonb;
          FOR v_option IN SELECT * FROM jsonb_array_elements(v_payload->'options')
          LOOP
            v_new_options := v_new_options || jsonb_build_array(
              v_option || jsonb_build_object('id', gen_random_uuid()::text)
            );
          END LOOP;
          v_payload := jsonb_set(v_payload, '{options}', v_new_options);
        END IF;

        PERFORM public.bulk_update_questions(
          v_form_id,
          jsonb_build_array(v_payload || jsonb_build_object('id', v_question_id))
        );

      ELSIF v_change_type = 'delete' THEN
        IF v_question_id IS NULL THEN
          RAISE EXCEPTION 'questionId required for delete change';
        END IF;

        DELETE FROM public.questions
        WHERE id = v_question_id AND form_id = v_form_id;

        UPDATE public.forms SET updated_at = now() WHERE id = v_form_id;

      ELSIF v_change_type = 'update_form' THEN
        v_form_updates := '{}'::jsonb;
        FOR v_option IN SELECT jsonb_build_object(k, v_payload->k) AS pair
                        FROM jsonb_object_keys(v_payload) AS k
                        WHERE k = ANY(v_allowed_form_keys)
        LOOP
          v_form_updates := v_form_updates || (v_option->'pair');
        END LOOP;

        IF v_form_updates <> '{}'::jsonb THEN
          UPDATE public.forms
          SET
            title = CASE WHEN v_form_updates ? 'title'
                    THEN v_form_updates->>'title' ELSE title END,
            description = CASE WHEN v_form_updates ? 'description'
                    THEN v_form_updates->>'description' ELSE description END,
            status = CASE WHEN v_form_updates ? 'status'
                    THEN (v_form_updates->>'status')::public.form_status ELSE status END,
            theme = CASE WHEN v_form_updates ? 'theme'
                    THEN v_form_updates->'theme' ELSE theme END,
            settings = CASE WHEN v_form_updates ? 'settings'
                    THEN v_form_updates->'settings' ELSE settings END,
            updated_at = now()
          WHERE id = v_form_id AND owner_id = auth.uid();
        END IF;

      ELSE
        RAISE EXCEPTION 'Unknown change type: %', v_change_type;
      END IF;
    END IF;

    -- Stamp accepted + past on the change record
    v_change := v_change || jsonb_build_object(
      'accepted', (p_action = 'accept'),
      'past', CASE WHEN v_past IS NULL THEN NULL ELSE to_jsonb(v_past::text) END
    );
    v_new_changes := v_new_changes || jsonb_build_array(v_change);
  END LOOP;

  -- Persist the updated stagedChanges array
  UPDATE public.ai_chat_messages
  SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{stagedChanges}', v_new_changes, true)
  WHERE id = p_message_id AND session_id = p_session_id;

  RETURN jsonb_build_object(
    'stagedChanges', v_new_changes,
    'form', public.get_form_details(v_form_id)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_all_staged_changes(uuid, uuid, text) TO authenticated;
