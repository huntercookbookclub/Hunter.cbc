-- ─────────────────────────────────────────────────────────────
-- Bookmarks: any logged-in user can save places and recipes.
-- Each user can only see, add and remove their own saves.
-- Supabase → SQL Editor → paste → Run. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.saved_items (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_type  text not null check (item_type in ('place', 'recipe')),
  item_id    text not null,          -- the place's or recipe's id
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);
-- "on delete cascade": deleting an account also deletes its saves.

alter table public.saved_items enable row level security;

drop policy if exists "users see own saves" on public.saved_items;
create policy "users see own saves"
  on public.saved_items for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users add own saves" on public.saved_items;
create policy "users add own saves"
  on public.saved_items for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users remove own saves" on public.saved_items;
create policy "users remove own saves"
  on public.saved_items for delete
  to authenticated
  using (user_id = auth.uid());
