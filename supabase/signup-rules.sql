-- ─────────────────────────────────────────────────────────────
-- Signup rule: only @stu-mail.hunter.cuny.edu emails can create accounts.
-- This is the server-side check; the signup form checks too, but anyone can
-- call Supabase directly and skip the form.
--
-- Setup (in this order):
--   1. Run eboard-roles.sql first, so new accounts can't post or upload.
--   2. Supabase → SQL Editor → paste this file → Run.
--   3. Authentication → Hooks → "Before User Created" → Postgres →
--      pick public.hook_before_user_created → Enable.
--   4. Authentication → Sign In / Providers → Email: turn on "Confirm email"
--      and "Allow new users to sign up".
--   5. Authentication → Emails → Templates → "Confirm signup": put {{ .Token }}
--      in the email so it sends a one-time code.
-- ─────────────────────────────────────────────────────────────

create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
as $$
begin
  if lower(coalesce(event -> 'user' ->> 'email', '')) not like '%@stu-mail.hunter.cuny.edu' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Please sign up with your @stu-mail.hunter.cuny.edu email.'
      )
    );
  end if;
  return '{}'::jsonb;
end;
$$;

-- Only Supabase Auth may call the hook.
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_before_user_created(jsonb) from authenticated, anon, public;
