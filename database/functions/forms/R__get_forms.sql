DROP FUNCTION IF EXISTS public.get_forms;
CREATE OR REPLACE FUNCTION public.get_forms(
  p_limit integer DEFAULT 20,
  p_page_number integer DEFAULT 1,
  p_owner_id uuid DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_limit integer;
  v_page_number integer;
  v_offset integer;
  v_total_count bigint;
  v_total_pages integer;
  v_forms jsonb;
BEGIN
  v_limit := COALESCE(p_limit, 20);
  v_page_number := COALESCE(p_page_number, 1);

  IF v_limit < 1 OR v_limit > 100 THEN
    RAISE EXCEPTION 'limit must be between 1 and 100';
  END IF;

  IF v_page_number < 1 THEN
    RAISE EXCEPTION 'page_number must be greater than 0';
  END IF;

  v_offset := (v_page_number - 1) * v_limit;

  SELECT COUNT(*)
  INTO v_total_count
  FROM public.forms f
  WHERE (p_owner_id IS NULL OR f.owner_id = p_owner_id)
    AND (
      p_search IS NULL
      OR p_search = ''
      OR f.title ILIKE CONCAT('%', p_search, '%')
    );

  v_total_pages := CASE
    WHEN v_total_count = 0 THEN 0
    ELSE CEIL(v_total_count::numeric / v_limit::numeric)::integer
  END;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', paged.id,
        'owner_id', paged.owner_id,
        'title', paged.title,
        'description', paged.description,
        'status', paged.status,
        'theme', paged.theme,
        'settings', paged.settings,
        'created_at', paged.created_at,
        'updated_at', paged.updated_at,
        'response_count', paged.response_count,
        'owner', jsonb_build_object(
          'id', paged.user_id,
          'email', paged.user_email,
          'name', paged.user_name
        )
      )
      ORDER BY paged.updated_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_forms
  FROM (
    SELECT
      f.id,
      f.owner_id,
      f.title,
      f.description,
      f.status,
      f.theme,
      f.settings,
      f.created_at,
      f.updated_at,
      COUNT(r.id)::integer AS response_count,
      u.id AS user_id,
      u.email AS user_email,
      COALESCE(
        u.raw_user_meta_data ->> 'full_name',
        u.raw_user_meta_data ->> 'name',
        u.email
      ) AS user_name
    FROM public.forms f
    LEFT JOIN public.responses r ON r.form_id = f.id
    LEFT JOIN auth.users u ON u.id = f.owner_id
    WHERE (p_owner_id IS NULL OR f.owner_id = p_owner_id)
      AND (
        p_search IS NULL
        OR p_search = ''
        OR f.title ILIKE CONCAT('%', p_search, '%')
      )
    GROUP BY
      f.id,
      f.owner_id,
      f.title,
      f.description,
      f.status,
      f.theme,
      f.settings,
      f.created_at,
      f.updated_at,
      u.id,
      u.email,
      u.raw_user_meta_data
    ORDER BY f.updated_at DESC
    LIMIT v_limit
    OFFSET v_offset
  ) AS paged;

  RETURN jsonb_build_object(
    'forms', v_forms,
    'pagination', jsonb_build_object(
      'limit', v_limit,
      'page_number', v_page_number,
      'total_count', v_total_count,
      'total_pages', v_total_pages,
      'has_previous', v_page_number > 1,
      'has_next', v_page_number < v_total_pages
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_forms(integer, integer, uuid, text) TO authenticated, anon;
