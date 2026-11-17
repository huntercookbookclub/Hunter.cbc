import { useEffect, useState } from 'react';
import { sbClient } from '../lib/supabaseClient';

const EMPTY = { total: 0, faces: [] };

// People who liked or saved a place AND opted in to showing it: up to 3 at
// random ({ name, avatar_url, liked, saved }) plus the total, for "+X".
// refreshKey: change it to fetch again (after a like/save or the opt-in switch).
export function usePlaceActivity(group, refreshKey) {
  const [activity, setActivity] = useState(EMPTY);
  const ids = group ? (group.reviews || [group]).map((r) => String(r.id)) : null;
  const idsKey = ids?.join(',') ?? '';

  useEffect(() => {
    setActivity(EMPTY);
    if (!idsKey) return;
    let cancelled = false;
    sbClient.rpc('place_activity', { place_ids: idsKey.split(',') }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error('Could not load who liked or saved this place:', error.message);
      else setActivity({ total: Number(data?.total) || 0, faces: data?.faces || [] });
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey, refreshKey]);

  return activity;
}
