import { useCallback, useEffect, useState } from 'react';
import { sbClient } from '../lib/supabaseClient';

// Fired after the switch changes, so every component showing it updates
// (Account Settings and the place card's note).
const CHANGED = 'cbc-show-activity-changed';

// The user's opt-in switch: show their name and photo on places they like or
// save (profiles.show_activity, off by default; supabase/profiles-activity.sql).
export function useShowActivity(currentUser) {
  const userId = currentUser?.id ?? null;
  const [showActivity, setLocal] = useState(false);

  useEffect(() => {
    setLocal(false);
    if (!userId) return;
    let cancelled = false;
    sbClient
      .from('profiles')
      .select('show_activity')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setLocal(!!data?.show_activity);
      });
    const onChanged = (e) => setLocal(e.detail);
    window.addEventListener(CHANGED, onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(CHANGED, onChanged);
    };
  }, [userId]);

  // Returns an error message, or null.
  const setShowActivity = useCallback(
    async (value) => {
      if (!userId) return 'You’re not logged in.';
      const { error } = await sbClient.from('profiles').update({ show_activity: value }).eq('id', userId);
      if (error) return error.message;
      window.dispatchEvent(new CustomEvent(CHANGED, { detail: value }));
      return null;
    },
    [userId]
  );

  return { showActivity, setShowActivity };
}
