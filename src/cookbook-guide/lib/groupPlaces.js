// Several people can recommend the same place. Each recommendation is its own
// row in the places table; this groups rows that are the same place so the
// map shows one pin and the panel can swipe between the recommendations.

const SAME_PLACE_METERS = 150;

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // drop accents
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function metersBetween(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// Same Google Maps link, or the same name within ~150m (covers a place added
// once from Google search and once by typing the address).
export function isSamePlace(a, b) {
  if (a.maps_url && b.maps_url && a.maps_url === b.maps_url) return true;
  return (
    normalizeName(a.name) === normalizeName(b.name) &&
    a.lat != null &&
    b.lat != null &&
    metersBetween(a, b) <= SAME_PLACE_METERS
  );
}

const byUploadTime = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);

// Returns one entry per place: the first recommendation's details (id, name,
// address, pin location...) plus `reviews`, every recommendation for it, oldest
// first. ponytail: compares every pair (O(n²)); fine for a club-sized map, switch
// to bucketing by rounded coordinates if it ever reaches thousands of places.
export function groupPlaces(places) {
  const groups = [];
  for (const place of [...places].sort(byUploadTime)) {
    const group = groups.find((g) => g.reviews.some((r) => isSamePlace(r, place)));
    if (group) group.reviews.push(place);
    else groups.push({ reviews: [place] });
  }
  return groups.map(({ reviews }) => ({ ...reviews[0], reviews }));
}
