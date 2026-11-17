-- ─────────────────────────────────────────────────────────────
-- Likes on places: any logged-in user can like a place once.
-- Who liked what stays private (each user only sees their own rows);
-- everyone, logged in or not, can see the like count per place.
-- Supabase → SQL Editor → paste → Run. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.place_likes (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  place_id   text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);
-- "on delete cascade": deleting an account also removes its likes.

alter table public.place_likes enable row level security;

drop policy if exists "users see own likes" on public.place_likes;
create policy "users see own likes"
  on public.place_likes for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users add own likes" on public.place_likes;
create policy "users add own likes"
  on public.place_likes for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users remove own likes" on public.place_likes;
create policy "users remove own likes"
  on public.place_likes for delete
  to authenticated
  using (user_id = auth.uid());

-- Public like counts, without revealing who liked what.
create or replace function public.place_like_counts()
returns table (place_id text, likes bigint)
language sql
stable
security definer
set search_path = public
as $$
  select place_id, count(*) from public.place_likes group by place_id
$$;

grant execute on function public.place_like_counts() to anon, authenticated;
