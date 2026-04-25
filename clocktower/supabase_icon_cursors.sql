alter table public.towers
  add column if not exists icon_cursors_enabled boolean not null default true;

update public.towers
set icon_cursors_enabled = true
where icon_cursors_enabled is null;

-- No additional table is needed. Cursor positions use Supabase Realtime
-- broadcast channels and are not stored.
--
-- The app already updates other owner-only tower settings, so this should use
-- the same existing towers update policy. If your project does not have one,
-- add an owner-only UPDATE policy for public.towers before using the toggle.
