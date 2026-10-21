import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force';
import { stableHash, type NutritionGraph, type FoodCategory } from '../data/schema';

export interface PlanetPosition extends SimulationNodeDatum { id: string; x: number; y: number; category: FoodCategory }
export const centers: Record<FoodCategory, [number, number]> = { burger: [-390, -220], breakfast: [-420, 180], side: [20, -290], drink: [450, 0], dessert: [-20, 290], other: [380, 350] };
export function layoutGraph(graph: NutritionGraph): PlanetPosition[] {
  const nodes: PlanetPosition[] = graph.nodes.map(food => {
    const h = stableHash(food.id), center = centers[food.category];
    return { id: food.id, category: food.category, x: center[0] + Math.cos(h) * (40 + h % 180), y: center[1] + Math.sin(h) * (40 + h % 180) };
  });
  let seed = 42;
  const simulation = forceSimulation(nodes).randomSource(() => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; })
    .force('x', forceX<PlanetPosition>(n => centers[n.category][0]).strength(.13))
    .force('y', forceY<PlanetPosition>(n => centers[n.category][1]).strength(.13))
    .force('charge', forceManyBody().strength(-35))
    .force('collide', forceCollide(47).iterations(3))
    .force('link', forceLink<PlanetPosition, { source: string; target: string }>(graph.edges.map(e => ({ source: e.source, target: e.target }))).id(n => n.id).distance(130).strength(.006))
    .stop();
  simulation.tick(260);
  return nodes;
}
