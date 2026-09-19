\set ON_ERROR_STOP on
-- Only an EMPTY, disposable local PostgreSQL database is supported.
-- The fixture refuses to run if Clocktower or Supabase user tables exist.
BEGIN;
\ir tower_invitations_fixture.sql
\ir ../migrations/20260919081622_repair_tower_invitations.sql
\ir ../migrations/20260919114000_email_tower_invitations.sql
\ir ../migrations/20260919124600_repair_email_invitation_acceptance.sql
\ir tower_invitations.test.sql
ROLLBACK;
