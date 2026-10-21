import type { FoodPlanet, NutrientKey } from '../data/schema';
export interface ComparisonRow { key: NutrientKey; label: string; values: (number | null)[]; unit: string; delta: number | null; comparable: boolean }
export function compareNutrition(_foods: readonly FoodPlanet[]): ComparisonRow[] { void _foods; return []; }
