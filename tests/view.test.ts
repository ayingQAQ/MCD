import { describe, expect, it } from 'vitest';
import { relationEdges, selectionFilters, visibleIds, focusIds } from '../src/graph/view';
import { demoDataset } from '../src/data/demo';
import type { NutritionGraph, SimilarityEdge } from '../src/data/schema';

const foods = demoDataset().foods.slice(0, 4);
const edge = (source: string, target: string): SimilarityEdge => ({ source, target, score: 90, comparableKeys: ['kcal', 'proteinG', 'fatG'], explanation: '测试' });
const graph: NutritionGraph = { nodes: foods, edges: [edge('demo-0', 'demo-1'), edge('demo-1', 'demo-2'), edge('demo-2', 'demo-3')] };
describe('relationship view regression cases', () => {
  it('clears search on selection and clears an incompatible category when following a neighbor', () => {
    expect(selectionFilters(foods[0], '巨无霸', 'drink')).toEqual({ query: '', category: 'all' });
    expect(selectionFilters(foods[0], '云朵', 'burger')).toEqual({ query: '', category: 'burger' });
  });
  it('expands exactly one additional layer while respecting visible filters', () => {
    const all = new Set(foods.map(f => f.id));
    expect(relationEdges(graph, 'demo-0', false, all).length).toBe(1);
    expect(relationEdges(graph, 'demo-0', true, all).map(e => e.target)).toEqual(['demo-1', 'demo-2']);
    expect(relationEdges(graph, 'demo-0', true, new Set(['demo-0', 'demo-1'])).length).toBe(1);
  });
  it('preserves both discovery planets and frames the pair even when its edge is absent from the graph', () => {
    const twin = edge('demo-0', 'demo-3');
    expect([...visibleIds(['demo-1'], [], twin)]).toEqual(['demo-1', 'demo-0', 'demo-3']);
    expect(focusIds('demo-0', [], twin)).toEqual(['demo-0', 'demo-3']);
    expect(focusIds(null, ['demo-1', 'demo-2'], null)).toEqual(['demo-1', 'demo-2']);
  });
});
