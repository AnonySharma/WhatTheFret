/**
 * User Progress & Preferences Store using localStorage
 */

import { STORAGE_KEYS } from '../constants';

const STORAGE_KEY = STORAGE_KEYS.USER_PROGRESS;

export interface UserProgressState {
  completedLessons: number[]; // 0 to 6 (7 lessons)
  completedMissions: string[];
  notesNotation: 'western' | 'indian'; // 'western' (C D E) or 'indian' (Sa Re Ga Ma)
  masteryPoints: number;
  lastActive: string;
}

const DEFAULT_PROGRESS: UserProgressState = {
  completedLessons: [0], // First lesson unlocked/visited by default
  completedMissions: [],
  notesNotation: 'western',
  masteryPoints: 100,
  lastActive: new Date().toISOString(),
};

export function loadUserProgress(): UserProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [0],
    };
  } catch (e) {
    console.warn('Failed to load user progress from localStorage:', e);
    return DEFAULT_PROGRESS;
  }
}

export function saveUserProgress(progress: Partial<UserProgressState>): UserProgressState {
  try {
    const current = loadUserProgress();
    const updated: UserProgressState = {
      ...current,
      ...progress,
      lastActive: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch a storage event so sibling components update live
    window.dispatchEvent(new Event('guitar_progress_updated'));
    return updated;
  } catch (e) {
    console.warn('Failed to save user progress to localStorage:', e);
    return { ...DEFAULT_PROGRESS, ...progress };
  }
}

export function toggleLessonCompletion(lessonIndex: number): UserProgressState {
  const current = loadUserProgress();
  const exists = current.completedLessons.includes(lessonIndex);
  const nextLessons = exists
    ? current.completedLessons.filter(idx => idx !== lessonIndex)
    : [...current.completedLessons, lessonIndex].sort((a, b) => a - b);

  const pointsChange = exists ? -50 : 100;
  return saveUserProgress({
    completedLessons: nextLessons,
    masteryPoints: Math.max(0, current.masteryPoints + pointsChange),
  });
}

export function isLessonCompleted(lessonIndex: number): boolean {
  const current = loadUserProgress();
  return current.completedLessons.includes(lessonIndex);
}

export function calculateProgressStats(completedLessons: number[], totalLessons: number = 7) {
  const count = completedLessons.length;
  const percentage = Math.min(100, Math.round((count / totalLessons) * 100));

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
