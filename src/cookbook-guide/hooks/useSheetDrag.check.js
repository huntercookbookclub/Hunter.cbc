// Self-check for the sheet math. Run: node src/cookbook-guide/hooks/useSheetDrag.check.js
import assert from 'node:assert/strict';
import { project, rubberband } from './useSheetDrag.js';

// A still finger projects nowhere; a downward flick projects further down.
assert.equal(project(0), 0);
assert.ok(project(1000) > 400, 'a 1000px/s flick should carry well past release');
assert.ok(project(-1000) < 0, 'an upward flick projects upward');

// Rubber-banding: always less than the real overshoot, and it keeps growing slowly.
assert.ok(rubberband(100, 600) < 100);
assert.ok(rubberband(200, 600) > rubberband(100, 600));
assert.ok(rubberband(1000, 600) < 600 * 0.55 + 1, 'never pulls past the limit');

console.log('sheet math: all passed');
