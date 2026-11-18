-- ─────────────────────────────────────────────────────────────
-- Recipe likes + "who liked or saved this recipe" (opt-in), mirroring places.
-- Run AFTER saved-items.sql and profiles-activity.sql.
-- Supabase → SQL Editor → paste → Run. Safe to run more than once.
--
--   recipe_likes        any logged-in user can like a recipe once; who liked
--                       what stays private (each user sees only their own rows)
--   recipe_like_counts  public like totals per recipe
--   recipe_activity     for a recipe: how many opted-in people liked/saved it,
--                       and up to 3 of them at random. Only people who turned
--                       on show_activity (profiles) are ever returned.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.recipe_likes (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recipe_id  text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

alter table public.recipe_likes enable row level security;

drop policy if exists "users see own recipe likes" on public.recipe_likes;
create policy "users see own recipe likes"
  on public.recipe_likes for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "users add own recipe likes" on public.recipe_likes;
create policy "users add own recipe likes"
  on public.recipe_likes for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users remove own recipe likes" on public.recipe_likes;
create policy "users remove own recipe likes"
  on public.recipe_likes for delete to authenticated
  using (user_id = auth.uid());

create or replace function public.recipe_like_counts()
returns table (recipe_id text, likes bigint)
language sql
stable
security definer
set search_path = public
as $$
  select recipe_id, count(*) from public.recipe_likes group by recipe_id
$$;

grant execute on function public.recipe_like_counts() to anon, authenticated;

create or replace function public.recipe_activity(recipe_ids text[])
returns json
language sql
volatile -- random order every call
security definer
set search_path = public
as $$
  with acts as (
    select user_id, bool_or(kind = 'like') as liked, bool_or(kind = 'save') as saved
    from (
      select user_id, 'like' as kind from public.recipe_likes where recipe_id = any (recipe_ids)
      union all
      select user_id, 'save' from public.saved_items
        where item_type = 'recipe' and item_id = any (recipe_ids)
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

grant execute on function public.recipe_activity(text[]) to anon, authenticated;
