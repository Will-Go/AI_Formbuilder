CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  user_id uuid;
  current_claims jsonb;
  has_password boolean;
  is_profile_complete boolean;
BEGIN
  current_claims := COALESCE(event->'claims', '{}'::jsonb);

  user_id := COALESCE(
    NULLIF(event->>'user_id', '')::uuid,
    NULLIF(current_claims->>'sub', '')::uuid
  );

  IF user_id IS NULL THEN
    RETURN jsonb_build_object('claims', current_claims);
  END IF;

  SELECT encrypted_password IS NOT NULL
  INTO has_password
  FROM auth.users
  WHERE id = user_id;

  is_profile_complete := COALESCE(has_password, false);

  current_claims := jsonb_set(
    current_claims,
    '{is_profile_complete}',
    to_jsonb(is_profile_complete),
    true
  );

  RETURN jsonb_build_object('claims', current_claims);
END;
$$;

GRANT EXECUTE
  ON FUNCTION public.custom_access_token_hook(jsonb)
  TO supabase_auth_admin;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

REVOKE EXECUTE
  ON FUNCTION public.custom_access_token_hook(jsonb)
  FROM authenticated, anon, public;
