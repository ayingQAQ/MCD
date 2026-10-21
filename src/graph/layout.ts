import { stableHash, type NutritionGraph, type FoodCategory } from '../data/schema';
import { depthFactor } from './depth';

export interface PlanetPosition { id: string; x: number; y: number; category: FoodCategory; depth: number }

/** A sparse, category-independent universe. Hash order and fixed offsets are reproducible.
 * Positions are separated on the home projection plane, then lifted into independent depths.
 * Nutrition affects the base radius only, never a planet's address or camera distance.
 */
export function layoutGraph(graph: NutritionGraph): PlanetPosition[] {
  const foods=[...graph.nodes].sort((a,b)=>stableHash(a.id)-stableHash(b.id)||a.id.localeCompare(b.id));
  const golden=Math.PI*(3-Math.sqrt(5));
  return foods.map((food,index)=>{
    const hash=stableHash(`distance:${food.id}`), depth=-.45+(hash%10000)/10000*1.95;
    const angle=index*golden+.35, radius=220*Math.sqrt(index+.4), f=depthFactor(depth);
    return {id:food.id,category:food.category,x:Math.round(Math.cos(angle)*radius/f*10)/10,y:Math.round(Math.sin(angle)*radius*.86/f*10)/10,depth};
  });
}
