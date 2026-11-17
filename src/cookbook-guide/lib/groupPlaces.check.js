// Self-check for grouping recommendations. Run: node src/cookbook-guide/lib/groupPlaces.check.js
import assert from 'node:assert/strict';
import { groupPlaces } from './groupPlaces.js';

const raku1 = { id: 'a', name: 'Raku', lat: 40.757, lng: -73.9808, createdAt: '2026-03-01T00:00:00Z' };
const raku2 = { id: 'b', name: 'RAKU ', lat: 40.7571, lng: -73.9807, createdAt: '2026-01-01T00:00:00Z' }; // ~14m away, earlier
const rakuFar = { id: 'c', name: 'Raku', lat: 40.7265, lng: -74.0003, createdAt: '2026-02-01T00:00:00Z' }; // another branch, ~4km
const cafe = { id: 'd', name: 'Blue Cafe', lat: 40.757, lng: -73.9808, createdAt: '2026-02-01T00:00:00Z' }; // same spot, different name
const linked1 = { id: 'e', name: 'Joe’s Pizza', maps_url: 'https://maps.google.com/?cid=1', lat: 40.7, lng: -73.9, createdAt: '2026-01-05T00:00:00Z' };
const linked2 = { id: 'f', name: 'Joes', maps_url: 'https://maps.google.com/?cid=1', lat: 40.7001, lng: -73.9, createdAt: '2026-01-06T00:00:00Z' };

const groups = groupPlaces([raku1, raku2, rakuFar, cafe, linked1, linked2]);
const find = (id) => groups.find((g) => g.reviews.some((r) => r.id === id));

assert.equal(groups.length, 4, 'raku pair, far raku, cafe, joe’s pair');
assert.deepEqual(find('a').reviews.map((r) => r.id), ['b', 'a'], 'same place, oldest recommendation first');
assert.equal(find('a').id, 'b', 'group takes the first recommendation’s id');
assert.notEqual(find('c'), find('a'), 'same name far away is a different place');
assert.notEqual(find('d'), find('a'), 'different name at the same spot is a different place');
assert.equal(find('e'), find('f'), 'same Google Maps link groups even with different names');

console.log('group places: all passed');
