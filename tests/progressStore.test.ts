import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEYS } from '../src/constants';

// Stub the browser globals before the store is used
class MemoryStorage {
  data = new Map<string, string>();
  failWrites = false;
  getItem(k: string) {
    return this.data.has(k) ? this.data.get(k)! : null;
  }
  setItem(k: string, v: string) {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}
const storage = new MemoryStorage();
(globalThis as any).localStorage = storage;
(globalThis as any).window = { dispatchEvent: () => true };

const {
  loadUserProgress,
  saveUserProgress,
  toggleLessonCompletion,
  calculateProgressStats,
  resetLessonProgress,
  readJSON,
  writeJSON,
  resetProgressMemory,
} = await import('../src/utils/progressStore');

const KEY = STORAGE_KEYS.USER_PROGRESS;

beforeEach(() => {
  storage.data.clear();
  storage.failWrites = false;
  resetProgressMemory();
});

test('a brand-new user has no completed lessons', () => {
  const p = loadUserProgress();
  assert.deepEqual(p.completedLessons, []);
  assert.equal(p.notesNotation, 'western');
});

test('un-completing a lesson subtracts exactly what completing added (no point farming)', () => {
  const start = loadUserProgress().masteryPoints;
  const done = toggleLessonCompletion(2);
  assert.deepEqual(done.completedLessons, [2]);
  assert.equal(done.masteryPoints, start + 100);
  const undone = toggleLessonCompletion(2);
  assert.deepEqual(undone.completedLessons, []);
  assert.equal(undone.masteryPoints, start);
  for (let i = 0; i < 5; i++) toggleLessonCompletion(2);
  assert.equal(loadUserProgress().masteryPoints, start + 100); // odd number of toggles
});

test('reset clears lessons and the points they earned', () => {
  const start = loadUserProgress().masteryPoints;
  toggleLessonCompletion(0);
  toggleLessonCompletion(1);
  const reset = resetLessonProgress();
  assert.deepEqual(reset.completedLessons, []);
  assert.equal(reset.masteryPoints, start);
});

test('corrupt JSON, "null" and non-objects fall back to defaults without throwing', () => {
  for (const raw of ['{not json', 'null', '42', '"str"', '[]']) {
    storage.setItem(KEY, raw);
    const p = loadUserProgress();
    assert.deepEqual(p.completedLessons, []);
    assert.equal(Number.isFinite(p.masteryPoints), true);
    assert.equal(p.notesNotation, 'western');
  }
});

test('fields are validated individually', () => {
  storage.setItem(
    KEY,
    JSON.stringify({
      completedLessons: [3, 3, 1, -1, 7, 2.5, '4', null, 6],
      masteryPoints: 'lots',
      notesNotation: 'klingon',
      completedMissions: ['a', 5, 'b'],
    })
  );
  const p = loadUserProgress();
  assert.deepEqual(p.completedLessons, [1, 3, 6]);
  assert.equal(p.masteryPoints, 100);
  assert.equal(p.notesNotation, 'western');
  assert.deepEqual(p.completedMissions, ['a', 'b']);

  storage.setItem(KEY, JSON.stringify({ masteryPoints: null, notesNotation: 'indian', completedLessons: 'x' }));
  const q = loadUserProgress();
  assert.equal(q.notesNotation, 'indian');
  assert.deepEqual(q.completedLessons, []);
  assert.equal(q.masteryPoints, 100);

  storage.setItem(KEY, JSON.stringify({ masteryPoints: Infinity }));
  assert.equal(loadUserProgress().masteryPoints, 100);
});

test('a failed save returns the real merged state and later loads still see it', () => {
  saveUserProgress({ completedLessons: [0, 1], notesNotation: 'indian' });
  storage.failWrites = true;
  const saved = saveUserProgress({ notesNotation: 'western' });
  assert.deepEqual(saved.completedLessons, [0, 1]); // not wiped
  assert.equal(saved.notesNotation, 'western');
  const loaded = loadUserProgress();
  assert.deepEqual(loaded.completedLessons, [0, 1]);
  assert.equal(loaded.notesNotation, 'western');
  const toggled = toggleLessonCompletion(4);
  assert.deepEqual(toggled.completedLessons, [0, 1, 4]);
});

test('calculateProgressStats never returns NaN', () => {
  assert.equal(calculateProgressStats([], 0).percentage, 0);
  assert.equal(calculateProgressStats([0, 1], 0).percentage, 0);
  assert.equal(calculateProgressStats([0, 1, 2], 7).percentage, 43);
  assert.equal(calculateProgressStats([0, 1, 2, 3, 4, 5, 6], 7).percentage, 100);
});

test('readJSON / writeJSON helpers', () => {
  assert.deepEqual(readJSON('missing', ['x']), ['x']);
  assert.equal(writeJSON('k', { a: 1 }), true);
  assert.deepEqual(readJSON('k', null), { a: 1 });
  storage.setItem('bad', '{oops');
  assert.equal(readJSON('bad', 7), 7);
  storage.setItem('nul', 'null');
  assert.equal(readJSON('nul', 9), 9);
  storage.failWrites = true;
  assert.equal(writeJSON('k2', 1), false);
});
