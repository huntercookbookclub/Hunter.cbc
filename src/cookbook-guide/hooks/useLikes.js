import { useCallback, useEffect, useState } from 'react';
import { sbClient } from '../lib/supabaseClient';

// Place likes (supabase/place-likes.sql): which places the logged-in user
// liked, plus public like counts for every place.
export function useLikes(currentUser) {
  const userId = currentUser?.id ?? null;
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [counts, setCounts] = useState({});

  // Counts are public, so load them for everyone.
  useEffect(() => {
    let cancelled = false;
    sbClient.rpc('place_like_counts').then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error('Could not load like counts:', error.message);
      else setCounts(Object.fromEntries(data.map((row) => [row.place_id, Number(row.likes)])));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setLikedIds(new Set());
    if (!userId) return;
    let cancelled = false;
    sbClient
      .from('place_likes')
      .select('place_id')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('Could not load likes:', error.message);
        else setLikedIds(new Set(data.map((row) => row.place_id)));
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

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
      ? await sbClient.from('place_likes').delete().match({ user_id: userId, place_id: key })
      : await sbClient.from('place_likes').insert({ place_id: key });
    if (error) {
      apply(wasLiked);
      return error.message;
    }
    return null;
  };

  return { isLiked, likeCount, toggleLike };
}
