import { useCallback, useEffect, useState } from 'react';
import { sbClient } from '../lib/supabaseClient';

// Bookmarks for the logged-in user, stored in the saved_items table
// (supabase/saved-items.sql). itemType is 'place' or 'recipe'.
export function useSaved(itemType, currentUser) {
  const userId = currentUser?.id ?? null;
  const [savedIds, setSavedIds] = useState(() => new Set());

  useEffect(() => {
    setSavedIds(new Set());
    if (!userId) return;
    let cancelled = false;
    sbClient
      .from('saved_items')
      .select('item_id')
      .eq('item_type', itemType)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('Could not load saved items:', error.message);
        else setSavedIds(new Set(data.map((row) => row.item_id)));
      });
    return () => {
      cancelled = true;
    };
  }, [itemType, userId]);

  const isSaved = useCallback((id) => savedIds.has(String(id)), [savedIds]);

  // Flips the save right away, then reverts if the database says no.
  // Returns an error message, or null.
  const toggleSaved = async (id) => {
    const key = String(id);
    const wasSaved = savedIds.has(key);
    const flip = (save) =>
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (save) next.add(key);
        else next.delete(key);
        return next;
      });

    flip(!wasSaved);
    const { error } = wasSaved
      ? await sbClient
          .from('saved_items')
          .delete()
          .match({ user_id: userId, item_type: itemType, item_id: key })
      : await sbClient.from('saved_items').insert({ item_type: itemType, item_id: key });
    if (error) {
      flip(wasSaved);
      return error.message;
    }
    return null;
  };

  return { savedIds, isSaved, toggleSaved };
}
