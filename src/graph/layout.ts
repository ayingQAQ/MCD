import { categories, stableHash, type NutritionGraph, type FoodCategory } from '../data/schema';
export interface PlanetPosition { id:string; x:number; y:number; z:number; category:FoodCategory }
export interface ClusterVolume { category:FoodCategory; x:number;y:number;z:number;radius:number;count:number }
const centers:Record<FoodCategory,[number,number,number]>={burger:[-900,140,250],breakfast:[-650,850,-1000],side:[1100,260,-650],drink:[250,-100,-1800],dessert:[900,-700,500],other:[-850,-900,-900]};
const random=(key:string)=>{let n=stableHash(key);n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return ((n^(n>>>16))>>>0)/4294967296;};
/** Fixed-seed rejection samples fill ellipsoidal VOLUMES, with true 3D collision spacing. */
export function layoutGraph(graph:NutritionGraph):PlanetPosition[]{
  const result:PlanetPosition[]=[];
  for(const category of categories){
    const members=graph.nodes.filter(f=>f.category===category).sort((a,b)=>a.id.localeCompare(b.id));
    const center=centers[category],radius=210+Math.cbrt(members.length)*110;
    for(const food of members){
      let candidate:PlanetPosition|undefined;
      for(let attempt=0;attempt<3000;attempt++){
        const key=`${food.id}:${attempt}`,u=random(key+':u'),v=random(key+':v'),w=random(key+':w');
        const z=2*u-1,theta=v*Math.PI*2,r=Math.cbrt(w),flat=Math.sqrt(1-z*z);
        const x=r*flat*Math.cos(theta),y=r*flat*Math.sin(theta);
        const point={id:food.id,category,x:center[0]+radius*(x*1.15+z*.2),y:center[1]+radius*y*.86,z:center[2]+radius*(z*1.15-x*.25)};
        if(result.every(other=>Math.hypot(other.x-point.x,other.y-point.y,other.z-point.z)>118)){candidate=point;break;}
      }
      if(!candidate)throw new Error('三维星团空间不足，无法保持安全间距');
      result.push(candidate);
    }
  }
  return result;
}
export function clusterVolumes(positions:PlanetPosition[]):ClusterVolume[]{
  return categories.flatMap(category=>{
    const points=positions.filter(p=>p.category===category);if(!points.length)return [];
    const center={x:points.reduce((s,p)=>s+p.x,0)/points.length,y:points.reduce((s,p)=>s+p.y,0)/points.length,z:points.reduce((s,p)=>s+p.z,0)/points.length};
    return [{category,...center,count:points.length,radius:Math.max(...points.map(p=>Math.hypot(p.x-center.x,p.y-center.y,p.z-center.z)))+48}];
  });
}
