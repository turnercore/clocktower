# Tower invitation database fix

`migrations/20260919081622_repair_tower_invitations.sql` replaces the existing
`public.add_user_to_tower(tower uuid, new_user_id uuid)` implementation. Its
arguments and `void` return type stay compatible with the existing application.

The public function is a `SECURITY INVOKER` wrapper. A helper in the unexposed
`clocktower_private` schema checks `auth.uid()`, locks the tower row, and permits
the owner or an admin of an unlocked tower. It updates the tower, its existing
rows and clocks, and `towers_users` in one transaction. Duplicate invitations
succeed without duplicate array entries. An explicit retry can repair that
invited user's incomplete membership. The migration itself changes no user data.

General table UPDATE policies stay unchanged. Keep `clocktower_private` out of
Supabase's exposed Data API schemas. Both functions use an empty `search_path`;
only `authenticated` receives execution permission.

## Local regression tests

The tests use synthetic users and mirror the live membership constraints and
relevant RLS policies. They cover owner/admin authorization, denied callers,
missing users, null arrays, duplicate invitations, partial membership, unrelated
towers, grants, and rollback after forced insert or child-update failures.

Run from the application directory, `clocktower/` inside the repository.

With a **disposable, empty local PostgreSQL database** and a superuser connection:

```sh
psql -X -v ON_ERROR_STOP=1 "$CLOCKTOWER_TEST_DATABASE_URL" \
  -f supabase/tests/run_tower_invitations.sql
```

The fixture refuses to run if `public.towers` or `auth.users` already exists.
The entire fixture and test run use one transaction that is rolled back. This
fixture is for empty PostgreSQL, not an already initialized Supabase database.

The following alternative runs PostgreSQL in memory with PGlite and requires no
server, container, database URL, credentials or changes to app dependencies:

```sh
CLOCKTOWER_SQL_RUNTIME="$(mktemp -d)"
npm install --prefix "$CLOCKTOWER_SQL_RUNTIME" --no-audit --no-fund \
  --save-exact @electric-sql/pglite@0.5.8
node supabase/tests/run_tower_invitations.mjs "$CLOCKTOWER_SQL_RUNTIME"
```

Validation on 2026-09-19: **31 SQL assertions passed** with PGlite 0.5.8. This
executes PostgreSQL functions, RLS and grants, rather than mocking SQL results.
It does not exercise PostgREST, Supabase Auth token validation, Realtime delivery
or simultaneous requests from separate database sessions. The application's
authenticated invitation flow still needs verification after deployment.

## Deploying to the existing Clocktower project

The live project inspected for this change is `estelamtbxdegwijmyha`.
It has an existing schema but an empty Supabase migration history. The repository
does not yet contain a full schema baseline. **Do not run `db reset`, `db push`,
or the SQL test fixture against production.** This migration alone cannot
initialize a new Clocktower database.

1. Review the exact migration file and the application changes together.
2. Apply the file as one named migration to the existing project. With Supabase
   MCP, call `apply_migration` with `project_id: "estelamtbxdegwijmyha"`,
   `name: "repair_tower_invitations"`, and `query` equal to the file's exact
   contents. Apply only this migration, not the fixture or a reconstructed schema.
3. Run the read-only verification below and Supabase's security advisors.
4. Deploy the application fix. Database-first deployment is compatible with
   the old action because the RPC signature is unchanged.
5. Verify the authenticated invitation flow with intended test accounts: owner
   in a locked tower, admin in an unlocked tower, and rejection for a locked
   admin or an ordinary member. Confirm the invited user can open the tower and
   see its existing clocks. Repeated invitations should return success without
   duplicate membership.

This work prepared and tested the migration locally. No live migration or test
invitation was performed during the audit.

## Read-only deployment verification

The following metadata query should show both functions owned by `postgres`,
empty search paths, `authenticated_can_execute = true`, and false for the other
two execution grants. Only the private helper should be a security definer.

```sql
SELECT
  n.nspname AS schema,
  p.proname AS function,
  pg_get_userbyid(p.proowner) AS owner,
  p.prosecdef AS security_definer,
  p.proconfig,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.oid IN (
  'public.add_user_to_tower(uuid,uuid)'::regprocedure,
  'clocktower_private.add_user_to_tower(uuid,uuid)'::regprocedure
)
ORDER BY n.nspname;

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'towers'
ORDER BY policyname;
```

The tower UPDATE policy should remain restricted to `owner = auth.uid()`.
The private helper grants membership without granting general tower editing
privileges to admins.

One pre-existing `towers_users` entry was absent from its tower's `users` array
at audit time. No user identifiers were collected and no historical membership
was changed. This aggregate query can recheck that condition:

```sql
SELECT count(*) AS indexed_members_absent_from_tower
FROM public.towers_users tu
JOIN public.towers t ON t.id = tu.tower_id
WHERE NOT coalesce(tu.user_id = ANY(t.users), false);
```

Concurrent creation of a row or clock still follows the application's existing
practice of copying a membership array into the new child. This patch does not
redesign that membership storage or add triggers for child creation.
