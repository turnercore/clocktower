-- Let the application repair membership when a recipient accepts an email
-- invite before the original request has finished writing membership.
-- Only the server-side service role may call the public wrapper.

GRANT USAGE ON SCHEMA clocktower_private TO service_role;

CREATE OR REPLACE FUNCTION clocktower_private.accept_tower_email_invitation(
  target_tower uuid,
  target_user uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF target_tower IS NULL OR target_user IS NULL THEN
    RAISE EXCEPTION 'Tower and user IDs are required.' USING ERRCODE = '22004';
  END IF;

  PERFORM 1 FROM public.towers WHERE id = target_tower FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tower not found.' USING ERRCODE = 'P0002';
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

ALTER FUNCTION clocktower_private.accept_tower_email_invitation(uuid, uuid)
  OWNER TO postgres;
REVOKE ALL ON FUNCTION
  clocktower_private.accept_tower_email_invitation(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION
  clocktower_private.accept_tower_email_invitation(uuid, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.accept_tower_email_invitation(
  tower uuid,
  new_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  PERFORM clocktower_private.accept_tower_email_invitation(
    tower,
    new_user_id
  );
END;
$function$;

ALTER FUNCTION public.accept_tower_email_invitation(uuid, uuid)
  OWNER TO postgres;
REVOKE ALL ON FUNCTION public.accept_tower_email_invitation(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_tower_email_invitation(uuid, uuid)
  TO service_role;

NOTIFY pgrst, 'reload schema';
