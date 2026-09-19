SELECT pg_temp.assert_true(
  NOT (SELECT prosecdef FROM pg_proc WHERE oid = 'public.add_user_to_tower(uuid,uuid)'::regprocedure),
  'public wrapper is SECURITY INVOKER'
) AS test;
SELECT pg_temp.assert_true(
  (SELECT prosecdef AND proconfig = ARRAY['search_path=""']
    FROM pg_proc WHERE oid = 'clocktower_private.add_user_to_tower(uuid,uuid)'::regprocedure),
  'private helper is SECURITY DEFINER with empty search_path'
) AS test;
SELECT pg_temp.assert_true(
  has_function_privilege('authenticated', 'public.add_user_to_tower(uuid,uuid)', 'EXECUTE')
  AND has_function_privilege('authenticated', 'clocktower_private.add_user_to_tower(uuid,uuid)', 'EXECUTE')
  AND has_schema_privilege('authenticated', 'clocktower_private', 'USAGE')
  AND NOT has_schema_privilege('authenticated', 'clocktower_private', 'CREATE'),
  'authenticated can execute but cannot replace the private helper'
) AS test;
SELECT pg_temp.assert_true(
  NOT has_function_privilege('anon', 'public.add_user_to_tower(uuid,uuid)', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'clocktower_private.add_user_to_tower(uuid,uuid)', 'EXECUTE')
  AND NOT has_function_privilege('service_role', 'public.add_user_to_tower(uuid,uuid)', 'EXECUTE'),
  'anonymous and service role cannot invoke the membership RPC'
) AS test;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000005');
RESET ROLE;
SELECT pg_temp.assert_true(
  (SELECT users @> ARRAY['00000000-0000-4000-8000-000000000005'::uuid] FROM public.towers WHERE id = '10000000-0000-4000-8000-000000000001')
  AND (SELECT users @> ARRAY['00000000-0000-4000-8000-000000000005'::uuid] FROM public.tower_rows WHERE tower_id = '10000000-0000-4000-8000-000000000001')
  AND (SELECT users @> ARRAY['00000000-0000-4000-8000-000000000005'::uuid] FROM public.clocks WHERE tower_id = '10000000-0000-4000-8000-000000000001')
  AND EXISTS (SELECT 1 FROM public.towers_users WHERE tower_id = '10000000-0000-4000-8000-000000000001' AND user_id = '00000000-0000-4000-8000-000000000005'),
  'owner invitation propagates to tower, rows, clocks and membership index'
) AS test;
SELECT pg_temp.assert_true(
  NOT EXISTS (SELECT 1 FROM public.towers WHERE id <> '10000000-0000-4000-8000-000000000001' AND users @> ARRAY['00000000-0000-4000-8000-000000000005'::uuid])
  AND NOT EXISTS (SELECT 1 FROM public.tower_rows WHERE tower_id <> '10000000-0000-4000-8000-000000000001' AND users @> ARRAY['00000000-0000-4000-8000-000000000005'::uuid])
  AND NOT EXISTS (SELECT 1 FROM public.clocks WHERE tower_id <> '10000000-0000-4000-8000-000000000001' AND users @> ARRAY['00000000-0000-4000-8000-000000000005'::uuid]),
  'invitation leaves every other tower unchanged'
) AS test;

-- Retrying the same invitation must not create duplicates.
SET LOCAL ROLE authenticated;
SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000005');
RESET ROLE;
SELECT pg_temp.assert_true(
  (SELECT cardinality(array_positions(users, '00000000-0000-4000-8000-000000000005'::uuid)) = 1 FROM public.towers WHERE id = '10000000-0000-4000-8000-000000000001')
  AND (SELECT cardinality(array_positions(users, '00000000-0000-4000-8000-000000000005'::uuid)) = 1 FROM public.tower_rows WHERE tower_id = '10000000-0000-4000-8000-000000000001')
  AND (SELECT cardinality(array_positions(users, '00000000-0000-4000-8000-000000000005'::uuid)) = 1 FROM public.clocks WHERE tower_id = '10000000-0000-4000-8000-000000000001')
  AND (SELECT count(*) = 1 FROM public.towers_users WHERE tower_id = '10000000-0000-4000-8000-000000000001' AND user_id = '00000000-0000-4000-8000-000000000005'),
  'duplicate invitation is idempotent in all four tables'
) AS test;

SET LOCAL ROLE authenticated;
SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000005');
SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000005');
RESET ROLE;
SELECT pg_temp.assert_true(
  EXISTS (SELECT 1 FROM public.towers_users WHERE tower_id = '10000000-0000-4000-8000-000000000002' AND user_id = '00000000-0000-4000-8000-000000000005'),
  'owner may invite while the tower is locked'
) AS test;
SELECT pg_temp.assert_true(
  (SELECT users = ARRAY['00000000-0000-4000-8000-000000000005'::uuid] FROM public.towers WHERE id = '10000000-0000-4000-8000-000000000003')
  AND (SELECT users = ARRAY['00000000-0000-4000-8000-000000000005'::uuid] FROM public.tower_rows WHERE tower_id = '10000000-0000-4000-8000-000000000003')
  AND (SELECT users = ARRAY['00000000-0000-4000-8000-000000000005'::uuid] FROM public.clocks WHERE tower_id = '10000000-0000-4000-8000-000000000003'),
  'null membership arrays are handled in every table'
) AS test;

-- Admin is deliberately absent from users, so the ordinary UPDATE policies
-- cannot perform the invitation. Only the narrowly authorized helper can.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
WITH changed AS (
  UPDATE public.towers SET is_locked = true WHERE id = '10000000-0000-4000-8000-000000000001' RETURNING id
)
SELECT pg_temp.assert_true((SELECT count(*) = 0 FROM changed), 'admin still cannot update general tower settings') AS test;
SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000006');
RESET ROLE;
SELECT pg_temp.assert_true(
  (SELECT users @> ARRAY['00000000-0000-4000-8000-000000000006'::uuid] FROM public.towers WHERE id = '10000000-0000-4000-8000-000000000001')
  AND (SELECT users @> ARRAY['00000000-0000-4000-8000-000000000006'::uuid] FROM public.tower_rows WHERE tower_id = '10000000-0000-4000-8000-000000000001')
  AND (SELECT users @> ARRAY['00000000-0000-4000-8000-000000000006'::uuid] FROM public.clocks WHERE tower_id = '10000000-0000-4000-8000-000000000001')
  AND EXISTS (SELECT 1 FROM public.towers_users WHERE tower_id = '10000000-0000-4000-8000-000000000001' AND user_id = '00000000-0000-4000-8000-000000000006'),
  'unlocked admin invitation propagates despite restrictive general UPDATE RLS'
) AS test;

SET LOCAL ROLE authenticated;
SELECT pg_temp.expect_sqlstate($q$ SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000007') $q$, '42501', 'locked admin is denied') AS test;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);
SELECT pg_temp.expect_sqlstate($q$ SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000007') $q$, '42501', 'ordinary member is denied') AS test;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', true);
SELECT pg_temp.expect_sqlstate($q$ SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000007') $q$, '42501', 'outsider is denied') AS test;
SELECT pg_temp.expect_sqlstate($q$ SELECT clocktower_private.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000007') $q$, '42501', 'direct private helper call also checks the caller') AS test;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT pg_temp.expect_sqlstate($q$ SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000007') $q$, '42501', 'authenticated role without user identity is denied') AS test;
SET LOCAL ROLE anon;
SELECT pg_temp.expect_sqlstate($q$ SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000007') $q$, '42501', 'anonymous role cannot execute public RPC') AS test;
SELECT pg_temp.expect_sqlstate($q$ SELECT clocktower_private.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000007') $q$, '42501', 'anonymous role cannot execute private helper') AS test;
SET LOCAL ROLE service_role;
SELECT pg_temp.expect_sqlstate($q$ SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000007') $q$, '42501', 'service role without caller identity is denied') AS test;
RESET ROLE;
SELECT pg_temp.assert_true(
  NOT EXISTS (SELECT 1 FROM public.towers WHERE users @> ARRAY['00000000-0000-4000-8000-000000000007'::uuid])
  AND NOT EXISTS (SELECT 1 FROM public.tower_rows WHERE users @> ARRAY['00000000-0000-4000-8000-000000000007'::uuid])
  AND NOT EXISTS (SELECT 1 FROM public.clocks WHERE users @> ARRAY['00000000-0000-4000-8000-000000000007'::uuid])
  AND NOT EXISTS (SELECT 1 FROM public.towers_users WHERE user_id = '00000000-0000-4000-8000-000000000007'),
  'all denied invitations leave membership unchanged'
) AS test;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
SELECT pg_temp.expect_sqlstate($q$ SELECT public.add_user_to_tower(NULL, '00000000-0000-4000-8000-000000000007') $q$, '22004', 'null tower ID is rejected') AS test;
SELECT pg_temp.expect_sqlstate($q$ SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', NULL) $q$, '22004', 'null target ID is rejected') AS test;
SELECT pg_temp.expect_sqlstate($q$ SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000099', '00000000-0000-4000-8000-000000000007') $q$, 'P0002', 'missing tower is rejected') AS test;
SELECT pg_temp.expect_sqlstate($q$ SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000010') $q$, 'P0002', 'target without a profile is rejected') AS test;
SELECT pg_temp.expect_sqlstate($q$ SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000099') $q$, 'P0002', 'nonexistent target is rejected') AS test;
RESET ROLE;

-- The reported production inconsistency is not changed by the migration.
-- A later, authorized explicit invitation may repair that user's own rows.
INSERT INTO public.towers_users (tower_id, user_id)
VALUES ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000008');
UPDATE public.clocks SET users = array_remove(users, '00000000-0000-4000-8000-000000000005'::uuid)
WHERE tower_id = '10000000-0000-4000-8000-000000000001';
SET LOCAL ROLE authenticated;
SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000008');
SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000005');
RESET ROLE;
SELECT pg_temp.assert_true(
  (SELECT users @> ARRAY['00000000-0000-4000-8000-000000000008'::uuid] FROM public.towers WHERE id = '10000000-0000-4000-8000-000000000001')
  AND (SELECT users @> ARRAY['00000000-0000-4000-8000-000000000008'::uuid] FROM public.tower_rows WHERE tower_id = '10000000-0000-4000-8000-000000000001')
  AND (SELECT users @> ARRAY['00000000-0000-4000-8000-000000000008'::uuid, '00000000-0000-4000-8000-000000000005'::uuid] FROM public.clocks WHERE tower_id = '10000000-0000-4000-8000-000000000001'),
  'authorized retry repairs partial membership without duplicate-key failure'
) AS test;

-- Force a final membership INSERT failure after the array writes. PostgreSQL
-- must roll back every prior update performed by the same function call.
ALTER TABLE public.towers_users ADD CONSTRAINT reject_test_target
CHECK (user_id <> '00000000-0000-4000-8000-000000000009'::uuid);
SET LOCAL ROLE authenticated;
SELECT pg_temp.expect_sqlstate($q$ SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000009') $q$, '23514', 'membership insert failure propagates') AS test;
RESET ROLE;
SELECT pg_temp.assert_true(
  NOT EXISTS (SELECT 1 FROM public.towers WHERE users @> ARRAY['00000000-0000-4000-8000-000000000009'::uuid])
  AND NOT EXISTS (SELECT 1 FROM public.tower_rows WHERE users @> ARRAY['00000000-0000-4000-8000-000000000009'::uuid])
  AND NOT EXISTS (SELECT 1 FROM public.clocks WHERE users @> ARRAY['00000000-0000-4000-8000-000000000009'::uuid])
  AND NOT EXISTS (SELECT 1 FROM public.towers_users WHERE user_id = '00000000-0000-4000-8000-000000000009'),
  'membership insert failure rolls back all preceding array updates'
) AS test;
ALTER TABLE public.towers_users DROP CONSTRAINT reject_test_target;
ALTER TABLE public.clocks ADD CONSTRAINT reject_test_target
CHECK (NOT coalesce('00000000-0000-4000-8000-000000000009'::uuid = ANY(users), false));
SET LOCAL ROLE authenticated;
SELECT pg_temp.expect_sqlstate($q$ SELECT public.add_user_to_tower('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000009') $q$, '23514', 'child clock update failure propagates') AS test;
RESET ROLE;
SELECT pg_temp.assert_true(
  NOT EXISTS (SELECT 1 FROM public.towers WHERE users @> ARRAY['00000000-0000-4000-8000-000000000009'::uuid])
  AND NOT EXISTS (SELECT 1 FROM public.tower_rows WHERE users @> ARRAY['00000000-0000-4000-8000-000000000009'::uuid])
  AND NOT EXISTS (SELECT 1 FROM public.clocks WHERE users @> ARRAY['00000000-0000-4000-8000-000000000009'::uuid])
  AND NOT EXISTS (SELECT 1 FROM public.towers_users WHERE user_id = '00000000-0000-4000-8000-000000000009'),
  'child clock failure rolls back tower and row changes'
) AS test;

SELECT pg_temp.assert_true(
  'A%_\*(B)|C.D' ~* '^a%_\\\*\(b\)\|c\.d$'
  AND NOT ('aXX_\*(b)|c.d' ~* '^a%_\\\*\(b\)\|c\.d$')
  AND NOT ('prefixa%_\*(b)|c.d' ~* '^a%_\\\*\(b\)\|c\.d$')
  AND NOT ('a%_\*(b)|c.dsuffix' ~* '^a%_\\\*\(b\)\|c\.d$'),
  'anchored username regex treats wildcard and regex characters literally'
) AS test;
