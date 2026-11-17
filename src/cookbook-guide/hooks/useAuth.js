import { useEffect, useState } from 'react';
import { sbClient } from '../lib/supabaseClient';

// E-board accounts carry role 'eboard' in app_metadata, which only an admin can set
// (see supabase/eboard-roles.sql). The database enforces this too; this check just
// decides which buttons to show.
export function isEboardUser(user) {
  return user?.app_metadata?.role === 'eboard';
}

// ── Sign up (any email, verified with a one-time code) ──
// The code comes from the "Confirm signup" email template, which must include
// {{ .Token }} (Supabase → Authentication → Emails).

export async function signUp(email, password) {
  const { error } = await sbClient.auth.signUp({ email, password });
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
