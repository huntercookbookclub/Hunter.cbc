import { useEffect, useState } from 'react';
import { sbClient } from '../lib/supabaseClient';

const EMPTY = { total: 0, faces: [] };

// People who liked or saved a place or recipe AND opted in to showing it: up to
// 3 at random ({ name, avatar_url, liked, saved }) plus the total, for "+X".
// item: a place group or a recipe (anything with `id`, optionally `reviews`).
// rpc: 'place_activity' or 'recipe_activity' (supabase/*-activity.sql).
// refreshKey: change it to fetch again (after a like/save or the opt-in switch).
export function usePlaceActivity(group, refreshKey, rpc = 'place_activity') {
  const [activity, setActivity] = useState(EMPTY);
  const ids = group ? (group.reviews || [group]).map((r) => String(r.id)) : null;
  const idsKey = ids?.join(',') ?? '';

  useEffect(() => {
    setActivity(EMPTY);
    if (!idsKey) return;
    let cancelled = false;
    const args = rpc === 'recipe_activity' ? { recipe_ids: idsKey.split(',') } : { place_ids: idsKey.split(',') };
    sbClient.rpc(rpc, args).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error('Could not load who liked or saved this:', error.message);
      else setActivity({ total: Number(data?.total) || 0, faces: data?.faces || [] });
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey, refreshKey, rpc]);

  return activity;
}
