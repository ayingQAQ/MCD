import type { FoodCategory, FoodPlanet, NutritionGraph, SimilarityEdge } from '../data/schema';
export function selectionFilters(_food: FoodPlanet, query: string, category: FoodCategory | 'all'): { query: string; category: FoodCategory | 'all' } { void _food; return { query, category }; }
export function relationEdges(graph: NutritionGraph, _selected: string | null, _expanded: boolean, _visible: Set<string>): SimilarityEdge[] { void _selected; void _expanded; void _visible; return graph.edges; }
export function visibleIds(filtered: string[], _route: string[], _highlight: SimilarityEdge | null): Set<string> { void _route; void _highlight; return new Set(filtered); }
export function focusIds(selected: string | null, _route: string[], _highlight: SimilarityEdge | null): string[] { void _route; void _highlight; return selected ? [selected] : []; }
