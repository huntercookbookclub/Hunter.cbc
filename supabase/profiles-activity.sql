-- ─────────────────────────────────────────────────────────────
-- Public profiles + opt-in "show my likes and saves on places".
-- Run AFTER saved-items.sql and place-likes.sql.
-- Supabase → SQL Editor → paste → Run. Safe to run more than once.
--
--   profiles        each account's public face: display name + profile picture,
--                   kept in sync from the account automatically, plus the
--                   show_activity switch (OFF by default: nothing is shown
--                   until the user turns it on).
--   place_activity  for a place: how many opted-in people liked/saved it, and
--                   up to 3 of them at random (name, photo, liked?, saved?).
--                   Nobody who hasn't opted in is ever returned.
-- ─────────────────────────────────────────────────────────────

-- 1. Profiles
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null default '',
  avatar_url    text,
  show_activity boolean not null default false,
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Users may only flip their own show_activity switch; name and photo come from
-- their account (step 2), so nobody can write those columns directly.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (show_activity) on public.profiles to authenticated;

-- 2. Keep name + photo in sync with the account (signup, Account Settings).
create or replace function public.sync_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      trim(concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_initial'))
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_url   = excluded.avatar_url,
        updated_at   = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_profile on auth.users;
create trigger on_auth_user_profile
  after insert or update of raw_user_meta_data on auth.users
  for each row execute function public.sync_profile();

-- Existing accounts get a profile now (show_activity stays off).
insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
    trim(concat_ws(' ', u.raw_user_meta_data ->> 'first_name', u.raw_user_meta_data ->> 'last_initial'))
  ),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;

-- 3. Faces on a place. place_ids: every recommendation id for that place.
create or replace function public.place_activity(place_ids text[])
returns json
language sql
volatile -- random order every call
security definer
set search_path = public
as $$
  with acts as (
    select user_id, bool_or(kind = 'like') as liked, bool_or(kind = 'save') as saved
    from (
      select user_id, 'like' as kind from public.place_likes where place_id = any (place_ids)
      union all
      select user_id, 'save' from public.saved_items
        where item_type = 'place' and item_id = any (place_ids)
    ) a
    group by user_id
  ),
  visible as (
    select p.display_name as name, p.avatar_url, acts.liked, acts.saved
    from acts
    join public.profiles p on p.id = acts.user_id
    where p.show_activity
  )
  select json_build_object(
    'total', (select count(*) from visible),
    'faces', coalesce((select json_agg(v) from (select * from visible order by random() limit 3) v), '[]'::json)
  )
$$;

grant execute on function public.place_activity(text[]) to anon, authenticated;

-- 4. Profile pictures for everyone: each account may only touch its own folder
--    (avatars/<user id>/...), images only, up to 2 MB.
update storage.buckets
  set file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  where id = 'avatars';

drop policy if exists "users upload own avatar" on storage.objects;
create policy "users upload own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users replace own avatar" on storage.objects;
create policy "users replace own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users delete own avatar" on storage.objects;
create policy "users delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Restrictive: whatever other avatar rules exist, writes must be in your own folder.
drop policy if exists "avatars own folder only" on storage.objects;
create policy "avatars own folder only" on storage.objects as restrictive
  for all to authenticated
  using (bucket_id <> 'avatars' or (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id <> 'avatars' or (storage.foldername(name))[1] = auth.uid()::text);
