-- ─────────────────────────────────────────────────────────────
-- Unique display names: no two accounts can have the same display name
-- (case and surrounding spaces ignored: "Maya C." = "maya c."). Emails are
-- already unique: Supabase Auth never allows two accounts with one email.
-- Run AFTER profiles-activity.sql, then re-run signup-checks.sql.
-- Supabase → SQL Editor → paste → Run. Safe to run more than once.
--
-- If step 1 fails with "could not create unique index", two accounts already
-- share a name. Find them with:
--   select lower(trim(display_name)) as name, count(*) from public.profiles
--   where trim(display_name) <> '' group by 1 having count(*) > 1;
-- rename one (Account Settings, or its user_metadata in Authentication →
-- Users), then run this file again.
-- ─────────────────────────────────────────────────────────────

-- 1. The rule itself, enforced by the database. Accounts without a name yet
--    ('') are left out so they don't collide with each other.
create unique index if not exists profiles_display_name_unique
  on public.profiles (lower(trim(display_name)))
  where trim(display_name) <> '';

-- 2. "Is this name free?" for the signup form and Account Settings, so people
--    get a clear message before saving. Your own current name counts as free.
create or replace function public.display_name_available(name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles
    where lower(trim(display_name)) = lower(trim(name))
      and trim(display_name) <> ''
      and id is distinct from auth.uid()
  )
$$;

grant execute on function public.display_name_available(text) to anon, authenticated;
