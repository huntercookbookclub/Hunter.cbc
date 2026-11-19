-- ─────────────────────────────────────────────────────────────
-- Anyone with an account can add places to the map (not just e-board).
-- Members can edit and delete only their own places; e-board can edit or
-- remove any place. Run AFTER eboard-roles.sql. Supabase → SQL Editor → Run.
-- Safe to run more than once.
-- ─────────────────────────────────────────────────────────────

-- 1. Remember who posted each place. Filled in automatically on insert.
alter table public.places
  add column if not exists author_id uuid references auth.users (id) on delete set null default auth.uid();

-- Existing places: link them to the account whose name they show.
update public.places p
set author_id = u.id
from auth.users u
where p.author_id is null
  and p.recommender_name <> ''
  and p.recommender_name in (trim(u.raw_user_meta_data ->> 'display_name'), u.email);

-- 2. Replace the e-board-only rules. These are RESTRICTIVE: they sit on top
--    of the table's existing "logged-in users can write" rules.
drop policy if exists "eboard only insert" on public.places;
drop policy if exists "eboard only update" on public.places;
drop policy if exists "eboard only delete" on public.places;

drop policy if exists "post places as yourself" on public.places;
create policy "post places as yourself" on public.places as restrictive
  for insert to authenticated
  with check (author_id = auth.uid());

drop policy if exists "edit own places or eboard" on public.places;
create policy "edit own places or eboard" on public.places as restrictive
  for update to authenticated
  using (author_id = auth.uid() or public.is_eboard())
  with check (author_id = auth.uid() or public.is_eboard());

drop policy if exists "delete own places or eboard" on public.places;
create policy "delete own places or eboard" on public.places as restrictive
  for delete to authenticated
  using (author_id = auth.uid() or public.is_eboard());

-- 3. Place photos: any account can upload; only the uploader or e-board can
--    change or delete a file.
drop policy if exists "eboard only uploads" on storage.objects;
drop policy if exists "eboard only file edits" on storage.objects;
drop policy if exists "eboard only file deletes" on storage.objects;

drop policy if exists "place photo edits: owner or eboard" on storage.objects;
create policy "place photo edits: owner or eboard" on storage.objects as restrictive
  for update to authenticated
  using (bucket_id <> 'place-photos' or owner_id = auth.uid()::text or public.is_eboard());

drop policy if exists "place photo deletes: owner or eboard" on storage.objects;
create policy "place photo deletes: owner or eboard" on storage.objects as restrictive
  for delete to authenticated
  using (bucket_id <> 'place-photos' or owner_id = auth.uid()::text or public.is_eboard());

-- 4. Make sure logged-in users can write at all (no-ops if your project
--    already has these permissive rules).
drop policy if exists "logged in can add places" on public.places;
create policy "logged in can add places" on public.places
  for insert to authenticated with check (true);
drop policy if exists "logged in can edit places" on public.places;
create policy "logged in can edit places" on public.places
  for update to authenticated using (true) with check (true);
drop policy if exists "logged in can delete places" on public.places;
create policy "logged in can delete places" on public.places
  for delete to authenticated using (true);
drop policy if exists "logged in can upload place photos" on storage.objects;
create policy "logged in can upload place photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'place-photos');
