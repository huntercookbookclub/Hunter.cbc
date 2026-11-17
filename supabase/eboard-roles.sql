-- ─────────────────────────────────────────────────────────────
-- E-board lockdown: only e-board accounts can add, edit, delete or upload.
-- Run this BEFORE opening public signup. Supabase → SQL Editor → paste → Run.
-- Safe to run more than once.
--
-- How it works: e-board accounts carry role = 'eboard' in their app_metadata
-- (users can't edit app_metadata themselves; only you can, in step 3 below).
-- The policies here are RESTRICTIVE, so they're added on top of the existing
-- rules in recipes.sql / lookback.sql / the places table: a write now needs to
-- pass the old rule AND be from an e-board account. Reading stays public.
-- ─────────────────────────────────────────────────────────────

-- 1. "Is the logged-in account e-board?"
create or replace function public.is_eboard()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'eboard'
$$;

-- 2. Restrictive write rules on the content tables
do $$
declare
  t text;
begin
  foreach t in array array['places', 'recipes', 'lookback_photos'] loop
    execute format('drop policy if exists "eboard only insert" on public.%I', t);
    execute format('drop policy if exists "eboard only update" on public.%I', t);
    execute format('drop policy if exists "eboard only delete" on public.%I', t);

    execute format(
      'create policy "eboard only insert" on public.%I as restrictive
         for insert to authenticated with check (public.is_eboard())', t);
    execute format(
      'create policy "eboard only update" on public.%I as restrictive
         for update to authenticated using (public.is_eboard()) with check (public.is_eboard())', t);
    execute format(
      'create policy "eboard only delete" on public.%I as restrictive
         for delete to authenticated using (public.is_eboard())', t);
  end loop;
end $$;

-- 3. Restrictive rules on the content photo buckets. Profile pictures
--    (avatars) are open to every account, limited to its own folder, in
--    profiles-activity.sql.
drop policy if exists "eboard only uploads" on storage.objects;
create policy "eboard only uploads" on storage.objects as restrictive
  for insert to authenticated
  with check (
    bucket_id not in ('place-photos', 'recipe-photos', 'lookback-photos')
    or public.is_eboard()
  );

drop policy if exists "eboard only file edits" on storage.objects;
create policy "eboard only file edits" on storage.objects as restrictive
  for update to authenticated
  using (
    bucket_id not in ('place-photos', 'recipe-photos', 'lookback-photos')
    or public.is_eboard()
  );

drop policy if exists "eboard only file deletes" on storage.objects;
create policy "eboard only file deletes" on storage.objects as restrictive
  for delete to authenticated
  using (
    bucket_id not in ('place-photos', 'recipe-photos', 'lookback-photos')
    or public.is_eboard()
  );

-- 4. Mark the e-board accounts. Replace the emails with your e-board's logins,
--    then run just this statement (and again whenever someone joins the e-board).
-- update auth.users
--   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "eboard"}'
--   where email in ('president@example.com', 'treasurer@example.com');
--
-- To remove someone from the e-board:
-- update auth.users
--   set raw_app_meta_data = raw_app_meta_data - 'role'
--   where email = 'former@example.com';
