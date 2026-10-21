import type { FoodCategory, FoodPlanet, NutritionGraph, SimilarityEdge } from '../data/schema';
export function selectionFilters(food: FoodPlanet, _query: string, category: FoodCategory | 'all'): { query: string; category: FoodCategory | 'all' } {
  void _query;
  return { query: '', category: category === 'all' || category === food.category ? category : 'all' };
}
export function relationEdges(graph: NutritionGraph, selected: string | null, expanded: boolean, visible: Set<string>): SimilarityEdge[] {
  if (!selected) return [];
  const direct = new Set<string>([selected]);
  for (const edge of graph.edges) if (edge.source === selected || edge.target === selected) { direct.add(edge.source); direct.add(edge.target); }
  return graph.edges.filter(edge => visible.has(edge.source) && visible.has(edge.target) && (edge.source === selected || edge.target === selected || expanded && (direct.has(edge.source) || direct.has(edge.target))));
}
export function visibleIds(filtered: string[], route: string[], highlight: SimilarityEdge | null): Set<string> {
  return new Set([...filtered, ...route, ...(highlight ? [highlight.source, highlight.target] : [])]);
}
export function focusIds(selected: string | null, route: string[], highlight: SimilarityEdge | null): string[] {
  return highlight ? [highlight.source, highlight.target] : selected ? [selected] : route;
}
