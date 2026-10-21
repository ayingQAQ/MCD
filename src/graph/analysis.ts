import type { FoodPlanet, NutritionGraph, NutrientKey, SimilarityEdge } from '../data/schema';
export type Normalized = Map<string, Partial<Record<NutrientKey, number>>>;
export function normalizeFoods(_foods: FoodPlanet[]): Normalized { void _foods; throw new Error('Not implemented'); }
export function compareFoods(_a: FoodPlanet, _b: FoodPlanet, _values: Normalized): { score: number; comparableKeys: NutrientKey[] } | null { void _a; void _b; void _values; throw new Error('Not implemented'); }
export function analyze(_foods: FoodPlanet[]): NutritionGraph { void _foods; throw new Error('Not implemented'); }
export function findRoute(_graph: NutritionGraph, _from: string, _to: string): string[] | null { void _graph; void _from; void _to; throw new Error('Not implemented'); }
export function discover(_foods: FoodPlanet[]): { twins: SimilarityEdge[]; lonely: { id: string; nearestScore: number }[] } { void _foods; throw new Error('Not implemented'); }
