-- Extend the repaired invitation path to resolve existing users by username or
-- auth email, and allow brand-new Supabase invite users to receive membership
-- before their public profile is created.

CREATE OR REPLACE FUNCTION clocktower_private.assert_can_invite_to_tower(
  target_tower uuid
)
RETURNS public.towers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  requesting_user uuid := auth.uid();
  selected_tower public.towers%ROWTYPE;
BEGIN
  IF requesting_user IS NULL THEN
    RAISE EXCEPTION 'Sign in before inviting a user.' USING ERRCODE = '42501';
  END IF;
  IF target_tower IS NULL THEN
    RAISE EXCEPTION 'Tower ID is required.' USING ERRCODE = '22004';
  END IF;

  SELECT * INTO selected_tower FROM public.towers WHERE id = target_tower;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tower not found.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT coalesce(
    selected_tower.owner = requesting_user
    OR (requesting_user = ANY(selected_tower.admin_users) AND NOT selected_tower.is_locked),
    false
  ) THEN
    RAISE EXCEPTION 'You do not have permission to invite users to this tower.'
      USING ERRCODE = '42501';
  END IF;
  RETURN selected_tower;
END;
$function$;

ALTER FUNCTION clocktower_private.assert_can_invite_to_tower(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION clocktower_private.assert_can_invite_to_tower(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION clocktower_private.assert_can_invite_to_tower(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION clocktower_private.find_tower_invite_target(
  target_tower uuid,
  target_identifier text,
  lookup_by_email boolean
)
RETURNS TABLE(user_id uuid, email_confirmed boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  normalized_identifier text := btrim(target_identifier);
BEGIN
  PERFORM clocktower_private.assert_can_invite_to_tower(target_tower);
  IF normalized_identifier IS NULL OR normalized_identifier = '' THEN
    RAISE EXCEPTION 'Username or email is required.' USING ERRCODE = '22004';
  END IF;

  IF coalesce(lookup_by_email, false) THEN
    RETURN QUERY
    SELECT u.id, u.email_confirmed_at IS NOT NULL
    FROM auth.users AS u
    WHERE lower(u.email) = lower(normalized_identifier)
    LIMIT 2;
  ELSE
    RETURN QUERY
    SELECT p.id, u.email_confirmed_at IS NOT NULL
    FROM public.profiles AS p
    JOIN auth.users AS u ON u.id = p.id
    WHERE lower(p.username) = lower(normalized_identifier)
    LIMIT 2;
  END IF;
END;
$function$;

ALTER FUNCTION clocktower_private.find_tower_invite_target(uuid, text, boolean) OWNER TO postgres;
REVOKE ALL ON FUNCTION clocktower_private.find_tower_invite_target(uuid, text, boolean)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION clocktower_private.find_tower_invite_target(uuid, text, boolean)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.find_tower_invite_target(
  tower uuid,
  identifier text,
  lookup_by_email boolean
)
RETURNS TABLE(user_id uuid, email_confirmed boolean)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT * FROM clocktower_private.find_tower_invite_target(
    tower, identifier, lookup_by_email
  );
END;
$function$;

ALTER FUNCTION public.find_tower_invite_target(uuid, text, boolean) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.find_tower_invite_target(uuid, text, boolean)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.find_tower_invite_target(uuid, text, boolean)
  TO authenticated;

CREATE OR REPLACE FUNCTION clocktower_private.add_user_to_tower(
  target_tower uuid,
  target_user uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  requesting_user uuid := auth.uid();
  selected_tower public.towers%ROWTYPE;
BEGIN
  IF requesting_user IS NULL THEN
    RAISE EXCEPTION 'Sign in before inviting a user.' USING ERRCODE = '42501';
  END IF;
  IF target_tower IS NULL OR target_user IS NULL THEN
    RAISE EXCEPTION 'Tower and user IDs are required.' USING ERRCODE = '22004';
  END IF;

  SELECT * INTO selected_tower
  FROM public.towers
  WHERE id = target_tower
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tower not found.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT coalesce(
    selected_tower.owner = requesting_user
    OR (requesting_user = ANY(selected_tower.admin_users) AND NOT selected_tower.is_locked),
    false
  ) THEN
    RAISE EXCEPTION 'You do not have permission to invite users to this tower.'
      USING ERRCODE = '42501';
  END IF;

  PERFORM 1 FROM auth.users WHERE id = target_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.towers
  SET users = array_append(coalesce(users, '{}'::uuid[]), target_user)
  WHERE id = target_tower
    AND NOT coalesce(target_user = ANY(users), false);

  UPDATE public.tower_rows
  SET users = array_append(coalesce(users, '{}'::uuid[]), target_user)
  WHERE tower_id = target_tower
    AND NOT coalesce(target_user = ANY(users), false);

  UPDATE public.clocks
  SET users = array_append(coalesce(users, '{}'::uuid[]), target_user)
  WHERE tower_id = target_tower
    AND NOT coalesce(target_user = ANY(users), false);

  INSERT INTO public.towers_users (tower_id, user_id)
  VALUES (target_tower, target_user)
  ON CONFLICT (tower_id, user_id) DO NOTHING;
END;
$function$;

ALTER FUNCTION clocktower_private.add_user_to_tower(uuid, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION clocktower_private.add_user_to_tower(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION clocktower_private.add_user_to_tower(uuid, uuid)
  TO authenticated;

NOTIFY pgrst, 'reload schema';
