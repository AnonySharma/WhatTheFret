/**
 * User Progress & Preferences Store using localStorage
 */

import { STORAGE_KEYS } from '../constants';

const STORAGE_KEY = STORAGE_KEYS.USER_PROGRESS;

/** Points awarded for completing a lesson; un-completing subtracts exactly this. */
export const LESSON_POINTS = 100;
const LESSON_COUNT = 7;

export interface UserProgressState {
  completedLessons: number[]; // 0 to 6 (7 lessons)
  completedMissions: string[];
  notesNotation: 'western' | 'indian'; // 'western' (C D E) or 'indian' (Sa Re Ga Ma)
  masteryPoints: number;
  lastActive: string;
}

const DEFAULT_PROGRESS: UserProgressState = {
  completedLessons: [],
  completedMissions: [],
  notesNotation: 'western',
  masteryPoints: 100,
  lastActive: new Date().toISOString(),
};

/** Reads and parses JSON from localStorage; any failure (missing, corrupt, blocked) yields `fallback`. */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

/** Writes JSON to localStorage. Returns false when storage is unavailable (private mode, quota). */
export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`Failed to write "${key}" to localStorage:`, e);
    return false;
  }
}

/** Last known good state, so a failing localStorage doesn't reset the session. */
let memoryCopy: UserProgressState | null = null;
/** True while the last write failed, i.e. storage is behind `memoryCopy`. */
let storageBehind = false;

/** Forgets the in-memory copy (used by tests to start from a clean slate). */
export function resetProgressMemory(): void {
  memoryCopy = null;
  storageBehind = false;
}

/** Validates an untrusted parsed value field by field, falling back to defaults for anything malformed. */
function sanitizeProgress(raw: unknown): UserProgressState {
  const obj = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

  const lessons = Array.isArray(obj.completedLessons)
    ? Array.from(
        new Set(
          obj.completedLessons.filter(
            (n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < LESSON_COUNT
          )
        )
      ).sort((a, b) => a - b)
    : [...DEFAULT_PROGRESS.completedLessons];

  const missions = Array.isArray(obj.completedMissions)
    ? obj.completedMissions.filter((m): m is string => typeof m === 'string')
    : [];

  const points =
    typeof obj.masteryPoints === 'number' && Number.isFinite(obj.masteryPoints)
      ? Math.max(0, obj.masteryPoints)
      : DEFAULT_PROGRESS.masteryPoints;

  const lastActive =
    typeof obj.lastActive === 'string' && !Number.isNaN(Date.parse(obj.lastActive))
      ? obj.lastActive
      : DEFAULT_PROGRESS.lastActive;

  return {
    completedLessons: lessons,
    completedMissions: missions,
    notesNotation: obj.notesNotation === 'indian' || obj.notesNotation === 'western' ? obj.notesNotation : 'western',
    masteryPoints: points,
    lastActive,
  };
}

export function loadUserProgress(): UserProgressState {
  if (storageBehind && memoryCopy) return memoryCopy;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to load user progress from localStorage:', e);
  }
  if (raw !== null) {
    try {
      return sanitizeProgress(JSON.parse(raw));
    } catch (e) {
      console.warn('Corrupt user progress in localStorage, using defaults:', e);
      return memoryCopy ?? sanitizeProgress(null);
    }
  }
  return memoryCopy ?? sanitizeProgress(null);
}

export function saveUserProgress(progress: Partial<UserProgressState>): UserProgressState {
  const current = loadUserProgress();
  const updated = sanitizeProgress({
    ...current,
    ...progress,
    lastActive: new Date().toISOString(),
  });
  memoryCopy = updated;
  // Even if the write fails (Safari private mode, quota) we return the real merged state.
  storageBehind = !writeJSON(STORAGE_KEY, updated);
  if (!storageBehind) {
    // Dispatch an event so sibling components update live
    try {
      window.dispatchEvent(new Event('guitar_progress_updated'));
    } catch {
      /* no window (tests / SSR) */
    }
  }
  return updated;
}

export function toggleLessonCompletion(lessonIndex: number): UserProgressState {
  const current = loadUserProgress();
  const exists = current.completedLessons.includes(lessonIndex);
  const nextLessons = exists
    ? current.completedLessons.filter(idx => idx !== lessonIndex)
    : [...current.completedLessons, lessonIndex].sort((a, b) => a - b);

  // Symmetric: un-completing removes exactly what completing added, so toggling can't farm points.
  const pointsChange = exists ? -LESSON_POINTS : LESSON_POINTS;
  return saveUserProgress({
    completedLessons: nextLessons,
    masteryPoints: Math.max(0, current.masteryPoints + pointsChange),
  });
}

/** Clears every completed lesson and the points they earned. */
export function resetLessonProgress(): UserProgressState {
  return saveUserProgress({
    completedLessons: [],
    masteryPoints: DEFAULT_PROGRESS.masteryPoints,
  });
}

export function isLessonCompleted(lessonIndex: number): boolean {
  const current = loadUserProgress();
  return current.completedLessons.includes(lessonIndex);
}

export function calculateProgressStats(completedLessons: number[], totalLessons: number = LESSON_COUNT) {
  const count = completedLessons.length;
  const percentage =
    totalLessons > 0 ? Math.min(100, Math.round((count / totalLessons) * 100)) : 0;

  let levelTitle = 'Novice Explorer';
  let levelColor = 'text-ink-400';
  let badgeIcon = '🌱';

  if (percentage >= 100) {
    levelTitle = 'Certified Guitar Maestro';
    levelColor = 'text-brand-400';
    badgeIcon = '👑';
  } else if (percentage >= 70) {
    levelTitle = 'Barre & Harmony Specialist';
    levelColor = 'text-gold-400';
    badgeIcon = '🎸';
  } else if (percentage >= 40) {
    levelTitle = 'Triad & Scale Decoder';
    levelColor = 'text-violet-400';
    badgeIcon = '✨';
  } else if (percentage > 15) {
    levelTitle = 'Ear Tuning Apprentice';
    levelColor = 'text-brand-300';
    badgeIcon = '🎧';
  }

  return {
    count,
    totalLessons,
    percentage,
    levelTitle,
    levelColor,
    badgeIcon,
  };
}
