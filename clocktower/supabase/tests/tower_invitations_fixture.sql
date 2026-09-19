-- Minimal synthetic fixture that retains production membership constraints,
-- roles and the RLS rules relevant to this RPC. It contains no real user data.
DO $fixture$
BEGIN
  IF to_regclass('public.towers') IS NOT NULL
    OR to_regclass('auth.users') IS NOT NULL THEN
    RAISE EXCEPTION 'Refusing to run: use an empty disposable local test database.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END;
$fixture$;

CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $uid$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $uid$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE
);
CREATE TABLE public.towers (
  id uuid PRIMARY KEY,
  owner uuid REFERENCES auth.users(id),
  users uuid[],
  admin_users uuid[],
  is_locked boolean NOT NULL DEFAULT false
);
CREATE TABLE public.tower_rows (
  id uuid PRIMARY KEY,
  tower_id uuid NOT NULL REFERENCES public.towers(id),
  users uuid[]
);
CREATE TABLE public.clocks (
  id uuid PRIMARY KEY,
  row_id uuid NOT NULL REFERENCES public.tower_rows(id),
  tower_id uuid NOT NULL REFERENCES public.towers(id),
  users uuid[]
);
CREATE TABLE public.towers_users (
  tower_id uuid NOT NULL REFERENCES public.towers(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tower_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.towers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tower_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.towers_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY towers_select ON public.towers FOR SELECT USING (true);
CREATE POLICY towers_update ON public.towers FOR UPDATE TO authenticated
  USING (owner = auth.uid()) WITH CHECK (owner = auth.uid());
CREATE POLICY rows_select ON public.tower_rows FOR SELECT USING (true);
CREATE POLICY rows_update ON public.tower_rows FOR UPDATE TO authenticated
  USING (auth.uid() = ANY(users)) WITH CHECK (auth.uid() = ANY(users));
CREATE POLICY clocks_select ON public.clocks FOR SELECT USING (true);
CREATE POLICY clocks_update ON public.clocks FOR UPDATE TO authenticated
  USING (auth.uid() = ANY(users)) WITH CHECK (auth.uid() = ANY(users));
CREATE POLICY memberships_select ON public.towers_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY memberships_insert ON public.towers_users FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY memberships_delete ON public.towers_users FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- IDs ending 1=owner, 2=admin, 3=ordinary member, 4=outsider,
-- 5/6/7/8/9=invite targets, 10=auth account with no profile.
INSERT INTO auth.users (id)
SELECT ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
FROM generate_series(1, 10) n;
INSERT INTO public.profiles (id, username)
SELECT id, 'test-user-' || right(id::text, 2)
FROM auth.users WHERE id <> '00000000-0000-4000-8000-000000000010';

-- 1=unlocked, 2=locked, 3=null arrays, 4=unrelated tower.
INSERT INTO public.towers (id, owner, users, admin_users, is_locked)
SELECT
  ('10000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  CASE WHEN n = 3 THEN NULL ELSE ARRAY[
    '00000000-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-4000-8000-000000000003'::uuid
  ] END,
  ARRAY['00000000-0000-4000-8000-000000000002'::uuid],
  n = 2
FROM generate_series(1, 4) n;

INSERT INTO public.tower_rows (id, tower_id, users)
SELECT ('20000000' || substring(id::text FROM 9))::uuid, id, users FROM public.towers;
INSERT INTO public.clocks (id, row_id, tower_id, users)
SELECT ('30000000' || substring(id::text FROM 9))::uuid, id, tower_id, users
FROM public.tower_rows;
INSERT INTO public.towers_users (tower_id, user_id)
SELECT id, unnest(users) FROM public.towers;

CREATE FUNCTION pg_temp.assert_true(actual boolean, test_name text)
RETURNS text LANGUAGE plpgsql AS $assert$
BEGIN
  IF actual IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'FAIL: %', test_name;
  END IF;
  RETURN 'PASS: ' || test_name;
END;
$assert$;

CREATE FUNCTION pg_temp.expect_sqlstate(statement text, expected text, test_name text)
RETURNS text LANGUAGE plpgsql AS $assert$
DECLARE
  actual text;
BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS actual = RETURNED_SQLSTATE;
    IF actual = expected THEN
      RETURN 'PASS: ' || test_name;
    END IF;
    RAISE EXCEPTION 'FAIL: %, expected SQLSTATE %, got %', test_name, expected, actual;
  END;
  RAISE EXCEPTION 'FAIL: %, expected SQLSTATE % but succeeded', test_name, expected;
END;
$assert$;
