// "What's new": the latest uploads across the map, the recipe book and the
// Big Back Lookback, newest first. All three tables are publicly readable.
import { sbClient } from '../cookbook-guide/lib/supabaseClient'

const SOURCES = [
  {
    table: 'places',
    columns: 'id, name, recommender_name, created_at',
    page: 'CookBook Guide',
    to: '/cookbook-guide',
    toItem: (r) => ({ who: r.recommender_name, what: r.name, verb: 'recommended' }),
  },
  {
    table: 'recipes',
    columns: 'id, title, author, created_at',
    page: 'Recipe Book',
    to: '/recipe-book',
    toItem: (r) => ({ who: r.author, what: r.title, verb: 'added' }),
  },
  {
    table: 'lookback_photos',
    columns: 'id, what, place, uploader_name, created_at',
    page: 'Big Back Lookback',
    to: '/big-back-lookback',
    toItem: (r) => ({ who: r.uploader_name, what: r.what || r.place || 'a photo', verb: 'posted' }),
  },
]

export async function fetchRecentUploads(limit = 12) {
  const results = await Promise.all(
    SOURCES.map((s) =>
      sbClient.from(s.table).select(s.columns).order('created_at', { ascending: false }).limit(limit)
    )
  )
  return results
    .flatMap(({ data }, i) =>
      (data || []).map((r) => ({
        key: `${SOURCES[i].table}-${r.id}`,
        page: SOURCES[i].page,
        to: SOURCES[i].to,
        at: r.created_at,
        ...SOURCES[i].toItem(r),
      }))
    )
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit)
}
