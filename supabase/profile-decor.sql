-- ─────────────────────────────────────────────────────────────
-- Profile decorations (banner + chef hat) picked in Account Settings.
-- Places keep a copy, like the recommender's name and picture.
-- Run BEFORE deploying the site code that uses them. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────
alter table public.places add column if not exists recommender_banner text not null default 'default';
alter table public.places add column if not exists recommender_hat boolean not null default false;

-- Recipes keep the same copy (plus the author's picture) for the Recipe Book byline.
alter table public.recipes add column if not exists author_avatar_url text;
alter table public.recipes add column if not exists author_banner text not null default 'default';
alter table public.recipes add column if not exists author_hat boolean not null default false;

-- Fill in pictures, banners and hats for recipes posted before this.
update public.recipes r
set author_avatar_url = u.raw_user_meta_data ->> 'avatar_url',
    author_banner = coalesce(u.raw_user_meta_data ->> 'banner', 'default'),
    author_hat = coalesce((u.raw_user_meta_data ->> 'hat')::boolean, false)
from auth.users u
where r.author_id = u.id;
