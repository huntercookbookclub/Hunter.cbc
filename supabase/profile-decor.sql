-- ─────────────────────────────────────────────────────────────
-- Profile decorations (banner + chef hat) picked in Account Settings.
-- Places keep a copy, like the recommender's name and picture.
-- Run BEFORE deploying the site code that uses them. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────
alter table public.places add column if not exists recommender_banner text not null default 'default';
alter table public.places add column if not exists recommender_hat boolean not null default false;
