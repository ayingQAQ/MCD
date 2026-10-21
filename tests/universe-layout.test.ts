import { expect, it } from 'vitest';
import snapshot from '../public/data/nutrition.snapshot.json';
import { datasetSchema } from '../src/data/schema';
import { analyze } from '../src/graph/analysis';
import { layoutGraph } from '../src/graph/layout';
import { depthFactor } from '../src/graph/depth';

const graph = analyze(datasetSchema.parse(snapshot).foods);
it('spreads independent planets across a world much larger than the viewport', () => {
  const points = layoutGraph(graph).map(p => ({ x: p.x * depthFactor(p.depth), y: p.y * depthFactor(p.depth) }));
  expect(Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x))).toBeGreaterThan(4000);
  const nearest = Math.min(...points.flatMap((a, i) => points.slice(i + 1).map(b => Math.hypot(a.x - b.x, a.y - b.y))));
  expect(nearest).toBeGreaterThan(180);
});
it('keeps location and depth independent from category and nutrition values', () => {
  const first = layoutGraph(graph);
  const changed = layoutGraph({ ...graph, nodes: graph.nodes.map(food => ({ ...food, category: 'other', nutrition: { ...food.nutrition, kcal: 0 } })) });
  expect(changed).toEqual(first.map(point => ({ ...point, category: 'other' })));
  expect(layoutGraph({ ...graph, nodes: [...graph.nodes].reverse() })).toEqual(first);
});
