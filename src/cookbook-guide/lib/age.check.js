// Self-check for the age rule. Run: node src/cookbook-guide/lib/age.check.js
import assert from 'node:assert/strict';
import { isOldEnough } from './age.js';

const today = new Date(2026, 10, 17); // Nov 17, 2026

assert.equal(isOldEnough('2013-11-17', today), true, 'turns 13 today');
assert.equal(isOldEnough('2013-11-18', today), false, 'turns 13 tomorrow');
assert.equal(isOldEnough('2013-12-01', today), false, 'birthday later this year');
assert.equal(isOldEnough('2013-01-01', today), true, 'birthday earlier this year');
assert.equal(isOldEnough('1990-06-15', today), true, 'adult');
assert.equal(isOldEnough('2020-01-01', today), false, 'young child');
assert.equal(isOldEnough('', today), false, 'empty input');

console.log('age check: all passed');
