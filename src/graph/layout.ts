import { forceCollide, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force';
import { stableHash, type NutritionGraph, type FoodCategory } from '../data/schema';

export interface PlanetPosition extends SimulationNodeDatum { id: string; x: number; y: number; category: FoodCategory }
export interface ClusterBounds { category: FoodCategory; x: number; y: number; radius: number; count: number }

const order: FoodCategory[] = ['burger', 'side', 'breakfast', 'dessert', 'other', 'drink'];
// Satellite galaxies sit around the largest one, spread wide to suit landscape screens.
const slots: [number, number][] = [[-1, -.46], [1, -.46], [-1, .52], [1, .52], [0, 1]];
const golden = Math.PI * (3 - Math.sqrt(5));
const spacing = 46;
const clusterRadius = (count: number) => spacing * Math.sqrt(count + .5) * 1.18 + 40;

/** Each inferred category becomes its own small spiral galaxy, separated by open space. */
export function layoutGraph(graph: NutritionGraph): PlanetPosition[] {
  const groups = new Map<FoodCategory, typeof graph.nodes>();
  for (const food of graph.nodes) groups.set(food.category, [...(groups.get(food.category) ?? []), food]);
  const present = order.filter(category => groups.has(category));
  const largest = [...present].sort((a, b) => groups.get(b)!.length - groups.get(a)!.length || order.indexOf(a) - order.indexOf(b))[0];
  const radius = new Map(present.map(category => [category, clusterRadius(groups.get(category)!.length)]));
  const centers = new Map<FoodCategory, [number, number]>();
  if (largest) centers.set(largest, [0, 0]);
  present.filter(category => category !== largest).forEach((category, index) => {
    const [dx, dy] = slots[index % slots.length], length = Math.hypot(dx, dy);
    const distance = radius.get(largest)! + radius.get(category)! + 110 + Math.floor(index / slots.length) * 400;
    centers.set(category, [dx / length * distance * 1.25, dy / length * distance]);
  });
  // Push satellites apart until no two galaxy discs touch.
  for (let pass = 0; pass < 40; pass++) {
    let moved = false;
    for (const a of present) for (const b of present) {
      if (a >= b) continue;
      const [ax, ay] = centers.get(a)!, [bx, by] = centers.get(b)!;
      const gap = radius.get(a)! + radius.get(b)! + 80, distance = Math.hypot(bx - ax, by - ay) || 1;
      if (distance >= gap) continue;
      const push = (gap - distance) / 2, ux = (bx - ax) / distance, uy = (by - ay) / distance;
      if (a !== largest) centers.set(a, [ax - ux * push * (b === largest ? 2 : 1), ay - uy * push * (b === largest ? 2 : 1)]);
      if (b !== largest) centers.set(b, [bx + ux * push * (a === largest ? 2 : 1), by + uy * push * (a === largest ? 2 : 1)]);
      moved = true;
    }
    if (!moved) break;
  }
  const nodes: PlanetPosition[] = [];
  const targets = new Map<string, [number, number]>();
  for (const category of present) {
    const [cx, cy] = centers.get(category)!;
    const members = [...groups.get(category)!].sort((a, b) => (b.nutrition.kcal ?? -1) - (a.nutrition.kcal ?? -1) || a.id.localeCompare(b.id));
    const twist = (stableHash(category) % 100) / 100 * Math.PI * 2;
    members.forEach((food, index) => {
      // Phyllotaxis disc with a gentle swirl: a dense core and looser outer arms.
      const r = spacing * Math.sqrt(index + .5) * (1 + .18 * index / Math.max(1, members.length));
      const angle = index * golden + twist + r * .0035;
      const jitter = (stableHash(food.id) % 1000) / 1000 - .5;
      const tx = cx + Math.cos(angle) * r * 1.18 + jitter * 10, ty = cy + Math.sin(angle) * r + jitter * 8;
      targets.set(food.id, [tx, ty]);
      nodes.push({ id: food.id, category: food.category, x: tx, y: ty });
    });
  }
  forceSimulation(nodes)
    .force('x', forceX<PlanetPosition>(n => targets.get(n.id)![0]).strength(.35))
    .force('y', forceY<PlanetPosition>(n => targets.get(n.id)![1]).strength(.35))
    .force('collide', forceCollide(40).iterations(2))
    .stop().tick(120);
  for (const node of nodes) { node.x = Math.round(node.x * 10) / 10; node.y = Math.round(node.y * 10) / 10; delete node.vx; delete node.vy; }
  return nodes;
}

/** Visual extent of each galaxy, used for its glow, orbit ring and name. */
export function clusterBounds(positions: PlanetPosition[]): ClusterBounds[] {
  const groups = new Map<FoodCategory, PlanetPosition[]>();
  for (const point of positions) groups.set(point.category, [...(groups.get(point.category) ?? []), point]);
  return [...groups].map(([category, points]) => {
    const x = points.reduce((sum, p) => sum + p.x, 0) / points.length, y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return { category, x, y, count: points.length, radius: Math.max(70, ...points.map(p => Math.hypot(p.x - x, p.y - y))) + 55 };
  });
}
