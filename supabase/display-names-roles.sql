-- ─────────────────────────────────────────────────────────────
-- Display name only (no more first name / last initial), and e-board roles
-- on places and recipes. Run AFTER recipes.sql, profiles-activity.sql and
-- unique-names.sql. Supabase → SQL Editor → paste → Run. Safe to run again.
-- ─────────────────────────────────────────────────────────────

-- 1. Recipes remember the e-board author's role, like places do.
alter table public.recipes add column if not exists author_role text;

-- 2. Accounts with only a first name + last initial get it as their display name.
--    (Fails with a unique-index error if that name is already someone else's:
--    rename one of them in Authentication → Users, then run again.)
update auth.users
set raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
  'display_name',
  trim(concat_ws(' ', raw_user_meta_data ->> 'first_name', raw_user_meta_data ->> 'last_initial')))
where coalesce(trim(raw_user_meta_data ->> 'display_name'), '') = ''
  and trim(concat_ws(' ', raw_user_meta_data ->> 'first_name', raw_user_meta_data ->> 'last_initial')) <> '';

-- 3. E-board places: show the poster's display name and role (not "Eboard").
--    Places store a copy of the name, so match on the old first name + initial,
--    the display name, or the email that older rows may hold.
update public.places p
set recommender_name = trim(u.raw_user_meta_data ->> 'display_name'),
    recommender_role = coalesce(nullif(trim(u.raw_user_meta_data ->> 'role'), ''), 'Eboard')
from auth.users u
where u.raw_app_meta_data ->> 'role' = 'eboard'
  and p.recommender_name in (
    trim(concat_ws(' ', u.raw_user_meta_data ->> 'first_name', u.raw_user_meta_data ->> 'last_initial')),
    trim(u.raw_user_meta_data ->> 'display_name'),
    u.email);

-- 4. E-board recipes: role next to the author's name.
update public.recipes r
set author_role = coalesce(nullif(trim(u.raw_user_meta_data ->> 'role'), ''), 'Eboard')
from auth.users u
where r.author_id = u.id and u.raw_app_meta_data ->> 'role' = 'eboard';

-- 5. Drop the old name fields.
update auth.users
set raw_user_meta_data = raw_user_meta_data - 'first_name' - 'last_initial'
where raw_user_meta_data ?| array['first_name', 'last_initial'];
