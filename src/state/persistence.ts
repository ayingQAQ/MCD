export type QuestStatus = 'started' | 'completed' | 'claimed';
export interface ExplorerState { version: 1; favoriteIds: string[]; labSelectedIds: string[]; recentlyViewed: string[]; questProgress: Record<string, QuestStatus>; sound: boolean }
const MAX_STORAGE_LENGTH = 128 * 1024;
const MAX_PROGRESS = 180;
const unsafeKeys = new Set(['__proto__', 'prototype', 'constructor']);

export function readPersistentState(raw: string | null, validIds: string[]): ExplorerState {
  const empty: ExplorerState = { version: 1, favoriteIds: [], labSelectedIds: [], recentlyViewed: [], questProgress: {}, sound: false };
  if (!raw || raw.length > MAX_STORAGE_LENGTH) return empty;
  try {
    const input: unknown = JSON.parse(raw);
    if (!input || typeof input !== 'object' || Array.isArray(input)) return empty;
    const value = input as Record<string, unknown>;
    if (value.version !== 1) return empty;
    const valid = new Set(validIds.filter(id => typeof id === 'string' && id.length > 0 && id.length <= 256 && !unsafeKeys.has(id)));
    const ids = (candidate: unknown, limit: number): string[] => {
      if (!Array.isArray(candidate)) return [];
      const result = new Set<string>();
      for (const id of candidate) {
        if (typeof id === 'string' && valid.has(id)) result.add(id);
        if (result.size >= limit) break;
      }
      return [...result];
    };
    const progress: Record<string, QuestStatus> = {};
    if (value.questProgress && typeof value.questProgress === 'object' && !Array.isArray(value.questProgress)) {
      const entries = Object.entries(value.questProgress).filter(([key, status]) => key.length > 0 && key.length <= 256 && !unsafeKeys.has(key) && (status === 'started' || status === 'completed' || status === 'claimed')).slice(-MAX_PROGRESS);
      for (const [key, status] of entries) progress[key] = status as QuestStatus;
    }
    return { version: 1, favoriteIds: ids(value.favoriteIds, Math.min(valid.size, 1000)), labSelectedIds: ids(value.labSelectedIds, 3), recentlyViewed: ids(value.recentlyViewed, 6), questProgress: progress, sound: value.sound === true };
  } catch {
    return empty;
  }
}
