-- ─────────────────────────────────────────────────────────────
-- "Delete account" (Account Settings): lets a logged-in user permanently
-- delete their own account after confirming their password. A browser can't
-- delete accounts directly, so the site calls this function, which can only
-- ever delete the caller's own account.
-- Supabase → SQL Editor → paste → Run. Safe to run more than once.
--
-- What goes with the account (set up by the other SQL files):
--   • saved places/recipes (saved_items) and likes (place_likes): deleted
--   • Big Back Lookback photo records (lookback_photos): deleted
--   • recipes: kept in the book, no longer linked to an account (author name stays)
-- ─────────────────────────────────────────────────────────────

-- Old version took no password; remove it so only the password-checked one exists.
drop function if exists public.delete_my_account();

-- The user must give their current password; it's checked here on the server,
-- so the account can't be deleted by anyone who only has a logged-in session.
create or replace function public.delete_my_account(password text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  stored text;
begin
  if auth.uid() is null then
    raise exception 'Not logged in';
  end if;
  select encrypted_password into stored from auth.users where id = auth.uid();
  if stored is null or stored = '' or extensions.crypt(password, stored) <> stored then
    raise exception 'Incorrect password';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account(text) from public, anon;
grant execute on function public.delete_my_account(text) to authenticated;
