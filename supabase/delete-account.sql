-- ─────────────────────────────────────────────────────────────
-- "Delete account": lets a logged-in user permanently delete their own
-- account. A browser can't delete accounts directly, so the site calls this
-- function, which can only ever delete the caller's own account.
-- Supabase → SQL Editor → paste → Run. Safe to run more than once.
--
-- What goes with the account (set up by the other SQL files):
--   • saved places/recipes (saved_items) and likes (place_likes): deleted
--   • Big Back Lookback photo records (lookback_photos): deleted
--   • recipes: kept in the book, no longer linked to an account (author name stays)
-- ─────────────────────────────────────────────────────────────

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not logged in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
