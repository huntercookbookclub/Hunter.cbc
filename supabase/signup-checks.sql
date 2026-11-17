-- ─────────────────────────────────────────────────────────────
-- Signup checks, enforced on the server so skipping the form skips nothing:
--   • Age (COPPA): only 13+. The form asks for a birthdate in the browser and
--     sends only the yes/no flag over_13 — the birthdate is never sent or stored.
--   • Terms: the user ticked "I agree to the Terms and Privacy Policy". The form
--     records which version and when (terms_version, terms_accepted_at).
-- Re-running this file replaces the earlier age-only version.
--
-- Setup:
--   1. Supabase → SQL Editor → paste this file → Run.
--   2. Authentication → Hooks → "Before User Created" → Postgres →
--      pick public.hook_before_user_created → Enable.
--   3. Test: sign up on the site (should work), then try a signup without the
--      flags (should be refused with one of the messages below).
--
-- Note: this hook also runs when you add a user from the Supabase dashboard.
-- To add one by hand, turn the hook off for a moment, add the user, turn it on.
-- ─────────────────────────────────────────────────────────────

create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
as $$
begin
  if coalesce(event -> 'user' -> 'user_metadata' ->> 'over_13', '') <> 'true' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Sorry, we can’t create an account for you.'
      )
    );
  end if;
  if coalesce(event -> 'user' -> 'user_metadata' ->> 'terms_accepted_at', '') = '' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 400,
        'message', 'Please agree to the Terms and Privacy Policy.'
      )
    );
  end if;
  return '{}'::jsonb;
end;
$$;

-- Only Supabase Auth may call the hook.
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_before_user_created(jsonb) from authenticated, anon, public;
