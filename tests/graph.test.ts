import { describe, expect, it } from 'vitest';
import { analyze, compareFoods, findRoute, normalizeFoods, discover } from '../src/graph/analysis';
import type { FoodPlanet } from '../src/data/schema';

function food(id: string, values: (number | null)[], category: FoodPlanet['category'] = 'burger'): FoodPlanet {
  return { id, name: id, category, categorySource: 'inferred', nutrition: { kcal: values[0], proteinG: values[1], fatG: values[2], carbsG: values[3], sodiumMg: values[4], calciumMg: null }, basis: { status: 'unverified', description: '测试', unitsVerified: false }, provenance: { provider: 'synthetic-demo', tool: null, fetchedAt: null, originalName: id, duplicateCount: 1 } };
}
const a = food('a', [100, 10, 3, 20, 100]);
const b = food('b', [100, 10, 3, 20, 100], 'side');
describe('nutrition graph', () => {
  it('has symmetric, bounded, deterministic similarity and handles constant columns', () => {
    const normalized = normalizeFoods([a, b]);
    expect(compareFoods(a, b, normalized)?.score).toBe(100);
    expect(compareFoods(a, b, normalized)).toEqual(compareFoods(b, a, normalized));
    expect(compareFoods(a, a, normalized)?.score).toBe(100);
  });
  it('does not fabricate similarity from fewer than three shared fields', () => {
    const c = food('c', [100, null, null, null, 20]);
    expect(compareFoods(a, c, normalizeFoods([a, c]))).toBeNull();
  });
  it('keeps normalization finite and bounded with outliers and entirely missing columns', () => {
    const outlier = food('outlier', [1e12, null, 0, 0, null]);
    const empty = food('empty', [null, null, null, null, null]);
    const normalized = normalizeFoods([a, b, outlier, empty]);
    expect(normalized.get('empty')).toEqual({});
    for (const values of normalized.values()) for (const value of Object.values(values)) {
      expect(Number.isFinite(value)).toBe(true); expect(value).toBeGreaterThanOrEqual(0); expect(value).toBeLessThanOrEqual(1);
    }
    expect(compareFoods(a, empty, normalized)).toBeNull();
  });
  it('deduplicates undirected edges, excludes self edges and is order independent', () => {
    const foods = Array.from({ length: 6 }, (_, i) => food(`f${i}`, [100, 10, 3, 20, 100]));
    const graph = analyze(foods);
    expect(graph.edges.some(e => e.source === e.target)).toBe(false);
    expect(new Set(graph.edges.map(e => `${e.source}:${e.target}`)).size).toBe(graph.edges.length);
    expect(analyze([...foods].reverse()).edges).toEqual(graph.edges);
    expect(graph.edges.filter(e => e.source === 'f0' || e.target === 'f0').length).toBeGreaterThan(3);
  });
  it('BFS handles same endpoints, missing endpoints, cycles, disconnection, and shortest hops', () => {
    const c = food('c', [100, 10, 3, 20, 100]);
    const d = food('d', [100, 10, 3, 20, 100]);
    const graph = analyze([a, b, c, d]);
    expect(findRoute(graph, 'a', 'a')).toEqual(['a']);
    expect(findRoute(graph, 'a', 'b')).toEqual(['a', 'b']);
    expect(findRoute(graph, 'a', 'missing')).toBeNull();
    expect(findRoute({ ...graph, edges: [] }, 'a', 'b')).toBeNull();
    const edge = graph.edges[0];
    expect(findRoute({ ...graph, edges: [{ ...edge, source: 'a', target: 'c' }, { ...edge, source: 'c', target: 'b' }] }, 'a', 'b')).toEqual(['a', 'c', 'b']);
  });
  it('discovers cross-category twins and excludes incomplete lonely candidates', () => {
    const incomplete = food('incomplete', [null, null, null, null, null]);
    const found = discover([a, b, incomplete]);
    expect(found.twins[0]).toMatchObject({ source: 'a', target: 'b', score: 100 });
    expect(found.lonely.map(x => x.id)).not.toContain('incomplete');
  });
});
