import { expect, it } from 'vitest';
import snapshot from '../public/data/nutrition.snapshot.json';
import { datasetSchema } from '../src/data/schema';
import { analyze } from '../src/graph/analysis';
import { layoutGraph } from '../src/graph/layout';
const graph=analyze(datasetSchema.parse(snapshot).foods);
it('gives every food a stable XYZ address with safe three-dimensional spacing',()=>{
  const points=layoutGraph(graph);
  for(const point of points)expect(Number.isFinite((point as unknown as {z:number}).z)).toBe(true);
  expect(layoutGraph({...graph,nodes:[...graph.nodes].reverse()})).toEqual(points);
  expect(layoutGraph({...graph,nodes:graph.nodes.map(f=>({...f,nutrition:{...f.nutrition,kcal:0}}))})).toEqual(points);
  const xyz=points as unknown as {x:number;y:number;z:number}[];
  const nearest=Math.min(...xyz.flatMap((a,i)=>xyz.slice(i+1).map(b=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z))));
  expect(nearest).toBeGreaterThan(105);
});
it('builds volumetric category clouds rather than flat discs or a shared plane',()=>{
  const points=layoutGraph(graph) as unknown as {category:string;x:number;y:number;z:number}[];
  for(const category of new Set(points.map(p=>p.category))){
    const group=points.filter(p=>p.category===category);
    for(const axis of ['x','y','z'] as const)expect(Math.max(...group.map(p=>p[axis]))-Math.min(...group.map(p=>p[axis]))).toBeGreaterThan(180);
    const [a,b,c]=group,normal={x:(b.y-a.y)*(c.z-a.z)-(b.z-a.z)*(c.y-a.y),y:(b.z-a.z)*(c.x-a.x)-(b.x-a.x)*(c.z-a.z),z:(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)};
    const volume=Math.max(...group.map(d=>Math.abs((d.x-a.x)*normal.x+(d.y-a.y)*normal.y+(d.z-a.z)*normal.z)));
    expect(volume).toBeGreaterThan(100000);
  }
});
