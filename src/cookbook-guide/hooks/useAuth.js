import { useEffect, useState } from 'react';
import { sbClient } from '../lib/supabaseClient';
import { isOldEnough } from '../lib/age';

// E-board accounts carry role 'eboard' in app_metadata, which only an admin can set
// (see supabase/eboard-roles.sql). The database enforces this too; this check just
// decides which buttons to show.
export function isEboardUser(user) {
  return user?.app_metadata?.role === 'eboard';
}

// ── Sign up (any email, verified with a one-time code) ──
// The code comes from the "Confirm signup" email template, which must include
// {{ .Token }} (Supabase → Authentication → Emails).
//
// Age screen (COPPA): the form asks for a birthdate, but only the yes/no flag
// over_13 is sent — the birthdate itself never leaves the browser. The server
// rejects any signup without that flag (supabase/signup-checks.sql), so skipping
// this form doesn't skip the check. The same server rule requires the user to
// have agreed to the Terms and Privacy Policy; we record which version and when.

// Bump this (and the "Effective" date in pages/Legal.jsx) when the terms change.
export const TERMS_VERSION = '2026-11-17';

export const UNDER_AGE_MESSAGE = 'Sorry, we can’t create an account for you.';
const AGE_BLOCK_KEY = 'cbc-signup-blocked';

// After an under-13 answer, keep blocking on this device, so the age can't just
// be changed and resubmitted (FTC guidance for neutral age screens).
export function isSignupBlocked() {
  try {
    return localStorage.getItem(AGE_BLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

export async function signUp(email, password, birthDate, agreedToTerms) {
  if (isSignupBlocked()) return UNDER_AGE_MESSAGE;
  if (!birthDate) return 'Enter your date of birth.';
  if (!agreedToTerms) return 'Please agree to the Terms and Privacy Policy.';
  if (!isOldEnough(birthDate)) {
    try {
      localStorage.setItem(AGE_BLOCK_KEY, '1');
    } catch {
      // storage unavailable: the server check still applies
    }
    return UNDER_AGE_MESSAGE;
  }
  const { error } = await sbClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        over_13: true,
        terms_version: TERMS_VERSION,
        terms_accepted_at: new Date().toISOString(),
      },
    },
  });
  return error ? error.message : null;
}

// Checks the emailed code; on success the user is signed in.
export async function verifySignupCode(email, code) {
  const { error } = await sbClient.auth.verifyOtp({ email, token: code, type: 'signup' });
  return error ? error.message : null;
}

export async function resendSignupCode(email) {
  const { error } = await sbClient.auth.resend({ type: 'signup', email });
  return error ? error.message : null;
}

// ── Forgot password (one-time code by email) ──
// The code comes from the "Reset Password" email template, which must include
// {{ .Token }} (Supabase → Authentication → Email Templates). Both return an
// error message string, or null on success, like login() below.

export async function requestPasswordReset(email) {
  const { error } = await sbClient.auth.resetPasswordForEmail(email);
  return error ? error.message : null;
}

// Checks the code (which signs the user in), then sets the new password.
export async function resetPasswordWithCode(email, code, newPassword) {
  const { error: codeError } = await sbClient.auth.verifyOtp({
    email,
    token: code,
    type: 'recovery',
  });
  if (codeError) return codeError.message;
  const { error } = await sbClient.auth.updateUser({ password: newPassword });
  return error ? error.message : null;
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    sbClient.auth.getUser().then(({ data }) => {
      setCurrentUser(data?.user || null);
      setAuthLoading(false);
    });

    const { data: listener } = sbClient.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { error } = await sbClient.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    const { data } = await sbClient.auth.getUser();
    setCurrentUser(data.user);
    return null;
  };

  const logout = async () => {
    await sbClient.auth.signOut();
    setCurrentUser(null);
  };

  const updateProfile = async (fields) => {
    const { data, error } = await sbClient.auth.updateUser({ data: fields });
    if (error) return error.message;
    setCurrentUser(data.user);
    return null;
  };

  return {
    currentUser,
    isEboard: isEboardUser(currentUser),
    authLoading,
    login,
    logout,
    updateProfile,
  };
}
