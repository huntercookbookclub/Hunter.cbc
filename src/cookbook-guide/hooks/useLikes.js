import { useCallback, useEffect, useState } from 'react';
import { sbClient } from '../lib/supabaseClient';

const KINDS = {
  place: { table: 'place_likes', idCol: 'place_id', counts: 'place_like_counts' }, // place-likes.sql
  recipe: { table: 'recipe_likes', idCol: 'recipe_id', counts: 'recipe_like_counts' }, // recipe-activity.sql
};

// Likes on places or recipes: which ones the logged-in user liked, plus public
// like counts for every one.
export function useLikes(currentUser, kind = 'place') {
  const { table, idCol, counts: countsFn } = KINDS[kind];
  const userId = currentUser?.id ?? null;
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [counts, setCounts] = useState({});

  // Counts are public, so load them for everyone.
  useEffect(() => {
    let cancelled = false;
    sbClient.rpc(countsFn).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error('Could not load like counts:', error.message);
      else setCounts(Object.fromEntries(data.map((row) => [row[idCol], Number(row.likes)])));
    });
    return () => {
      cancelled = true;
    };
  }, [countsFn, idCol]);

  useEffect(() => {
    setLikedIds(new Set());
    if (!userId) return;
    let cancelled = false;
    sbClient
      .from(table)
      .select(idCol)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('Could not load likes:', error.message);
        else setLikedIds(new Set(data.map((row) => row[idCol])));
      });
    return () => {
      cancelled = true;
    };
  }, [userId, table, idCol]);

  const isLiked = useCallback((id) => likedIds.has(String(id)), [likedIds]);
  const likeCount = useCallback((id) => counts[String(id)] || 0, [counts]);

  // Flips the like and count right away, then reverts if the database says no.
  // Returns an error message, or null.
  const toggleLike = async (id) => {
    const key = String(id);
    const wasLiked = likedIds.has(key);
    const apply = (like) => {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (like) next.add(key);
        else next.delete(key);
        return next;
      });
      setCounts((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) + (like ? 1 : -1)) }));
    };

    apply(!wasLiked);
    const { error } = wasLiked
      ? await sbClient.from(table).delete().match({ user_id: userId, [idCol]: key })
      : await sbClient.from(table).insert({ [idCol]: key });
    if (error) {
      apply(wasLiked);
      return error.message;
    }
    return null;
  };

  return { isLiked, likeCount, toggleLike };
}
