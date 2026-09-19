-- Preserve the existing RPC signature while making membership changes atomic
-- and enforcing the same owner/admin rule used by the application. Do not add
-- this schema to Supabase's exposed Data API schemas.
CREATE SCHEMA IF NOT EXISTS clocktower_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA clocktower_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA clocktower_private TO authenticated;

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

  -- Serialize invitations and owner/lock changes for this tower. Re-check
  -- authorization against the locked row, rather than trusting the caller.
  SELECT * INTO selected_tower
  FROM public.towers
  WHERE id = target_tower
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tower not found.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT coalesce(
    selected_tower.owner = requesting_user
    OR (
      requesting_user = ANY(selected_tower.admin_users)
      AND NOT selected_tower.is_locked
    ),
    false
  ) THEN
    RAISE EXCEPTION 'You do not have permission to invite users to this tower.'
      USING ERRCODE = '42501';
  END IF;

  PERFORM 1 FROM public.profiles WHERE id = target_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.' USING ERRCODE = 'P0002';
  END IF;

  -- Repeating an invitation is safe. Each table is repaired only for the
  -- explicitly invited user, including a prior partially completed invite.
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

-- This public entry point uses the caller's privileges. The privileged helper
-- is outside the exposed schema and independently checks auth.uid().
CREATE OR REPLACE FUNCTION public.add_user_to_tower(tower uuid, new_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  PERFORM clocktower_private.add_user_to_tower(tower, new_user_id);
END;
$function$;

ALTER FUNCTION public.add_user_to_tower(uuid, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.add_user_to_tower(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_user_to_tower(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
