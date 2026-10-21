export type QuestStatus = 'started' | 'completed' | 'claimed';
export interface ExplorerState { version: 1; favoriteIds: string[]; labSelectedIds: string[]; recentlyViewed: string[]; questProgress: Record<string, QuestStatus>; sound: boolean }
export function readPersistentState(_raw: string | null, _validIds: string[]): ExplorerState { void _raw; void _validIds; return { version: 1, favoriteIds: [], labSelectedIds: [], recentlyViewed: [], questProgress: {}, sound: false }; }
