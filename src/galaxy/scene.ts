import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Dataset, FoodCategory, NutrientKey, NutritionGraph, SimilarityEdge } from '../data/schema';
import { stableHash } from '../data/schema';
import { clusterVolumes, type PlanetPosition } from '../graph/layout';
import { quantile } from '../graph/analysis';
import { relationEdges } from '../graph/view';
import { createPlanetMaterials, makeLabelTexture } from './materials';

export interface GalaxySceneInput {
  dataset:Dataset; graph:NutritionGraph; positions:PlanetPosition[]; visible:Set<string>;
  lens:NutrientKey; selected:string|null; route:string[]; routeStep:number; showRelations:boolean;
  expanded:boolean;showLabels:boolean;highlight:SimilarityEdge|null;category?:FoodCategory|'all';categoryFocusKey?:number;
  onSelect:(id:string|null)=>void;onRelationSelect?:(edge:SimilarityEdge)=>void;
  insets?:()=>{left:number;bottom:number};
}
interface Pose {position:THREE.Vector3;target:THREE.Vector3}
interface Planet {id:string;group:THREE.Group;body:THREE.Mesh;outline:THREE.Mesh;ring?:THREE.Mesh;label?:THREE.Sprite;radius:number;targetRadius:number}
export interface SceneController {sync:()=>void;home:()=>void;overview:()=>void;restore:()=>void;dolly:(factor:number)=>void;category:(category:FoodCategory)=>void;dispose:()=>void}

export function createGalaxyScene(canvas:HTMLCanvasElement,read:()=>GalaxySceneInput,labels:Map<FoodCategory,HTMLButtonElement>,report:(zoom:number,focused:boolean)=>void,onError:(message:string)=>void):SceneController {
  const initial=read(),renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor('#243447');
  const scene=new THREE.Scene();scene.background=new THREE.Color('#243447');scene.fog=new THREE.Fog('#52677C',2500,9500);
  const camera=new THREE.PerspectiveCamera(55,1,2,30000);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.075;controls.rotateSpeed=.55;controls.zoomSpeed=.85;controls.panSpeed=.75;
  controls.minDistance=45;controls.maxDistance=18000;controls.maxPolarAngle=Math.PI*.93;controls.minPolarAngle=Math.PI*.07;controls.maxTargetRadius=8500;
  controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
  controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const home:Pose={position:new THREE.Vector3(-260,330,1120),target:new THREE.Vector3(-600,50,150)};
  const copy=(pose:Pose):Pose=>({position:pose.position.clone(),target:pose.target.clone()});
  const pose=():Pose=>({position:camera.position.clone(),target:controls.target.clone()});
  const initialBounds=canvas.getBoundingClientRect();
  let width=initialBounds.width||1000,height=initialBounds.height||800,frame=0,dirty=true,disposed=false,hover:string|null=null,saved:Pose|null=null;
  camera.aspect=width/height;camera.updateProjectionMatrix();
  let flight:{start:number;from:Pose;to:Pose}|null=null;
  let previousSelected:string|null=null,previousLens:NutrientKey|null=null,previousCategory:FoodCategory|'all'|undefined,previousRoute='',previousEdges='';
  let previousCategoryFocusKey:number|undefined;
  let down:{x:number;y:number;pointer:number;moved:boolean}|null=null;
  const pointers=new Set<number>();
  function stopInertia(){controls.enableDamping=false;controls.update();controls.enableDamping=!reduced.matches;}
  function apply(next:Pose){stopInertia();camera.position.copy(next.position);controls.target.copy(next.target);controls.update();dirty=true;}
  apply(home);
  scene.add(new THREE.HemisphereLight('#FFF6DF','#857E91',.9));
  const sun=new THREE.DirectionalLight('#FFF4D4',1.4);sun.position.set(-500,1000,1400);scene.add(sun);
  const fill=new THREE.DirectionalLight('#C4DEF2',.3);fill.position.set(900,-200,-500);scene.add(fill);
  const art=createPlanetMaterials();
  const sphere=new THREE.SphereGeometry(1,24,16),vertices=sphere.getAttribute('position');
  for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i),bend=1+.013*Math.sin(x*7+y*4)*Math.cos(z*6);vertices.setXYZ(i,x*bend,y*bend,z*bend);}
  sphere.computeVertexNormals();
  const ringGeometry=new THREE.TorusGeometry(1.45,.045,5,48);
  const planets:Planet[]=[],byId=new Map<string,Planet>(),bodies:THREE.Mesh[]=[];
  const positionById=new Map(initial.positions.map(p=>[p.id,p]));
  const labelTextures:THREE.Texture[]=[],labelMaterials:THREE.SpriteMaterial[]=[];
  for(const food of initial.dataset.foods){
    const point=positionById.get(food.id)!;if(!point)continue;
    const group=new THREE.Group();group.position.set(point.x,point.y,point.z);
    const body=new THREE.Mesh(sphere,art.materials[food.category]),outline=new THREE.Mesh(sphere,art.outline);
    body.userData.foodId=food.id;group.add(outline,body);bodies.push(body);
    const planet:Planet={id:food.id,group,body,outline,radius:30,targetRadius:30};
    if(food.category==='dessert'||stableHash(food.id)%5===0){const ring=new THREE.Mesh(ringGeometry,art.ring);ring.rotation.set(1.15,.22,(stableHash(food.id)%10)*.06);group.add(ring);planet.ring=ring;}
    planets.push(planet);byId.set(food.id,planet);scene.add(group);
  }
  const clouds=clusterVolumes(initial.positions);
  // A single batched 3D point cloud, with deterministic XYZ positions, recedes behind the food.
  const starGeometry=new THREE.BufferGeometry(),starPositions:number[]=[],starColors:number[]=[];
  for(let i=0;i<1300;i++){
    const a=(stableHash(`a:${i}`)%10000)/10000*Math.PI*2,z=(stableHash(`b:${i}`)%10000)/5000-1,r=4200+(stableHash(`r:${i}`)%8500),flat=Math.sqrt(1-z*z);
    starPositions.push(Math.cos(a)*flat*r,z*r,Math.sin(a)*flat*r);
    const color=new THREE.Color(i%9===0?'#F4D58E':i%3===0?'#D9E4ED':'#B5CDD8');starColors.push(color.r,color.g,color.b);
  }
  starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));starGeometry.setAttribute('color',new THREE.Float32BufferAttribute(starColors,3));
  const starCanvas=document.createElement('canvas');starCanvas.width=32;starCanvas.height=32;
  const starCtx=starCanvas.getContext('2d')!;starCtx.fillStyle='white';starCtx.beginPath();starCtx.arc(16,16,12,0,Math.PI*2);starCtx.fill();
  const starTexture=new THREE.CanvasTexture(starCanvas);
  const starMaterial=new THREE.PointsMaterial({size:18,map:starTexture,vertexColors:true,transparent:true,opacity:.85,depthWrite:false,fog:false,sizeAttenuation:true});
  const stars=new THREE.Points(starGeometry,starMaterial);scene.add(stars);
  const lines=new THREE.Group();scene.add(lines);
  const edgeObjects:{edge:SimilarityEdge;line:THREE.Line;points:THREE.Vector3[]}[]=[];
  const raycaster=new THREE.Raycaster();raycaster.params.Line={threshold:12};
  const ndc=new THREE.Vector2();

  function fly(next:Pose){
    stopInertia();
    if(reduced.matches){flight=null;apply(next);}else flight={start:performance.now(),from:pose(),to:copy(next)};
    dirty=true;
  }
  function focusFood(planet:Planet){
    const direction=camera.position.clone().sub(controls.target).normalize(),target=planet.group.position.clone();
    const distance=width<600?Math.max(380,planet.targetRadius*12):Math.max(240,planet.targetRadius*7);
    fly({target,position:target.clone().addScaledVector(direction,distance)});
  }
  function framePoints(points:THREE.Vector3[],padding=150){
    if(!points.length)return;
    const box=new THREE.Box3().setFromPoints(points),center=box.getCenter(new THREE.Vector3()),extent=box.getSize(new THREE.Vector3()).length()/2+padding;
    const direction=camera.position.clone().sub(controls.target).normalize();
    const angle=Math.min(THREE.MathUtils.degToRad(camera.fov/2),Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect));
    const distance=Math.max(220,extent/Math.sin(angle));
    fly({target:center,position:center.clone().addScaledVector(direction,distance)});
  }
  function focusCategory(category:FoodCategory){
    const points=initial.positions.filter(p=>p.category===category).map(p=>new THREE.Vector3(p.x,p.y,p.z));
    framePoints(points,100);
  }
  function restore(){if(saved){const previous=saved;saved=null;fly(previous);}read().onSelect(null);dirty=true;}
  function updateView(){
    const p=read(),inset=p.insets?.()??{left:0,bottom:0};
    const left=width>850?Math.min(inset.left,width*.45):0,right=width>750&&p.selected?370:0;
    const centerX=left+(width-left-right)/2;
    const centerY=width<600&&p.selected?height*.20:(height-Math.min(inset.bottom,height*.25))/2;
    camera.aspect=width/height;camera.setViewOffset(width,height,width/2-centerX,height/2-centerY,width,height);camera.updateProjectionMatrix();dirty=true;
  }
  function clearEdges(){for(const item of edgeObjects){item.line.geometry.dispose();(item.line.material as THREE.Material).dispose();}edgeObjects.length=0;lines.clear();}
  function sync(){
    if(disposed)return;const p=read();
    if(previousLens!==p.lens){
      const values=p.dataset.foods.flatMap(f=>f.nutrition[p.lens]===null?[]:[f.nutrition[p.lens]!]).sort((a,b)=>a-b),lo=quantile(values,.05),hi=quantile(values,.95);
      for(const food of p.dataset.foods){const planet=byId.get(food.id);if(!planet)continue;const value=food.nutrition[p.lens];planet.targetRadius=value===null?16:hi===lo?30:21+20*Math.sqrt(Math.max(0,Math.min(1,(value-lo)/(hi-lo))));}
      previousLens=p.lens;
    }
    for(const planet of planets)planet.group.visible=p.visible.has(planet.id);
    if(previousSelected!==p.selected){
      if(p.selected){
        if(!previousSelected&&!saved)saved=pose();
        const planet=byId.get(p.selected);
        if(planet)focusFood(planet);
      }else if(saved){const previous=saved;saved=null;fly(previous);}
      previousSelected=p.selected;
    }
    const routeKey=`${p.route.join(':')}:${p.highlight?.source??''}:${p.highlight?.target??''}`;
    if((p.highlight||!p.selected)&&routeKey!==previousRoute){
      const ids=p.highlight?[p.highlight.source,p.highlight.target]:p.route;
      framePoints(ids.flatMap(id=>byId.has(id)?[byId.get(id)!.group.position]:[]),120);
    }
    previousRoute=routeKey;
    if((p.category!==previousCategory||p.categoryFocusKey!==previousCategoryFocusKey)&&p.category&&p.category!=='all'&&!p.selected&&!p.highlight)focusCategory(p.category);
    previousCategory=p.category;
    previousCategoryFocusKey=p.categoryFocusKey;
    const edgeKey=`${p.selected}:${p.showRelations}:${p.expanded}:${p.route.join(':')}:${p.routeStep}:${p.highlight?.source}:${p.highlight?.target}:${[...p.visible].join(',')}`;
    if(edgeKey!==previousEdges){
      clearEdges();
      const displayed=new Set(p.showRelations?relationEdges(p.graph,p.selected,p.expanded,p.visible):[]);
      const pairs=new Set(p.route.slice(1,Math.max(1,p.routeStep+1)).map((id,i)=>[id,p.route[i]].sort().join(':')));
      const all=p.highlight?[...p.graph.edges.filter(e=>[e.source,e.target].sort().join(':')!==[p.highlight!.source,p.highlight!.target].sort().join(':')),p.highlight]:p.graph.edges;
      for(const edge of all){
        const route=pairs.has([edge.source,edge.target].sort().join(':')),highlight=edge===p.highlight;
        if(!(displayed.has(edge)||route||highlight)||!p.visible.has(edge.source)||!p.visible.has(edge.target))continue;
        const a=byId.get(edge.source)!.group.position,b=byId.get(edge.target)!.group.position,control=a.clone().lerp(b,.5).add(new THREE.Vector3(0,80,60));
        const points=new THREE.QuadraticBezierCurve3(a,control,b).getPoints(48),geometry=new THREE.BufferGeometry().setFromPoints(points);
        const material=new THREE.LineDashedMaterial({color:highlight?'#D6B9ED':route?'#F1C77A':'#B2C3D1',dashSize:15,gapSize:10,transparent:true,opacity:.8});
        const line=new THREE.Line(geometry,material);line.computeLineDistances();lines.add(line);edgeObjects.push({edge,line,points});
      }
      previousEdges=edgeKey;
    }
    controls.minDistance=p.selected?Math.max(75,(byId.get(p.selected)?.targetRadius??30)*2.7):45;
    updateView();dirty=true;
  }
  function hit(clientX:number,clientY:number){
    const rect=canvas.getBoundingClientRect();ndc.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(ndc,camera);
    const body=raycaster.intersectObjects(bodies.filter(b=>b.parent?.visible),false)[0];
    if(body)return {foodId:body.object.userData.foodId as string};
    const edge=raycaster.intersectObjects(edgeObjects.map(e=>e.line),false)[0];
    return edge?{edge:edgeObjects.find(e=>e.line===edge.object)?.edge}:{};
  }
  const start=()=>{flight=null;dirty=true;};controls.addEventListener('start',start);
  const change=()=>{dirty=true;};controls.addEventListener('change',change);
  const pointerDown=(event:PointerEvent)=>{pointers.add(event.pointerId);if(pointers.size===1)down={x:event.clientX,y:event.clientY,pointer:event.pointerId,moved:false};else if(down)down.moved=true;};
  const pointerMove=(event:PointerEvent)=>{
    if(down&&Math.hypot(event.clientX-down.x,event.clientY-down.y)>5)down.moved=true;
    if(!pointers.size){hover=hit(event.clientX,event.clientY).foodId??null;canvas.style.cursor=hover?'pointer':'grab';dirty=true;}
  };
  const pointerEnd=(event:PointerEvent)=>{
    if(event.type==='pointerup'&&event.button===0&&pointers.size===1&&down&&!down.moved){const result=hit(event.clientX,event.clientY);if(result.edge)read().onRelationSelect?.(result.edge);else read().onSelect(result.foodId??null);}
    pointers.delete(event.pointerId);if(!pointers.size)down=null;else if(down)down.moved=true;
  };
  const leave=()=>{hover=null;dirty=true;};
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerEnd);canvas.addEventListener('pointercancel',pointerEnd);canvas.addEventListener('pointerleave',leave);
  const lost=(event:Event)=>{event.preventDefault();onError('三维图形上下文已中断，请重新载入星系。餐品目录仍可使用。');};canvas.addEventListener('webglcontextlost',lost);
  function project(point:THREE.Vector3){const v=point.clone().project(camera);return {x:(v.x+1)*width/2,y:(1-v.y)*height/2,z:v.z};}
  let lastReport='';
  function publish(){
    const snapshot=planets.map(planet=>{
      const center=project(planet.group.position),local=planet.group.position.clone().applyMatrix4(camera.matrixWorldInverse),depth=-local.z,r=planet.radius*1.035;
      // Tangents to a camera-space sphere: conservative projected bounds also work off axis.
      const denominator=Math.max(.001,depth*depth-r*r),focal=height/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
      const axisRadius=(axis:number)=>{const tangent=r*Math.sqrt(Math.max(0,axis*axis+depth*depth-r*r));return Math.max(Math.abs((axis*depth-tangent)/denominator-axis/depth),Math.abs((axis*depth+tangent)/denominator-axis/depth))*focal;};
      const radius=depth>r?Math.hypot(axisRadius(local.x),axisRadius(local.y)):Math.max(width,height);
      return {id:planet.id,...center,radius,visible:planet.group.visible&&center.z>-1&&center.z<1&&center.x>-radius&&center.x<width+radius&&center.y>-radius&&center.y<height+radius};
    });
    const windowIds=snapshot.filter(p=>p.visible).map(p=>p.id);
    const rounded=(v:THREE.Vector3)=>v.toArray().map(n=>Number(n.toFixed(6)));
    canvas.dataset.camera=JSON.stringify({position:rounded(camera.position),target:rounded(controls.target),distance:Number(camera.position.distanceTo(controls.target).toFixed(6))});
    canvas.dataset.planets=JSON.stringify(snapshot);canvas.dataset.edges=JSON.stringify(edgeObjects.map(e=>({source:e.edge.source,target:e.edge.target,points:e.points.map(project)})));
    canvas.dataset.rendered=String(windowIds.length);canvas.dataset.window=JSON.stringify(windowIds);canvas.dataset.total=String(read().visible.size);
    canvas.dataset.gpu=JSON.stringify({calls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures});
    const zoom=Math.round(home.position.distanceTo(home.target)/camera.position.distanceTo(controls.target)*100),key=`${zoom}:${!!saved}`;
    if(key!==lastReport){report(zoom,!!saved);lastReport=key;}
    for(const cloud of clouds){const button=labels.get(cloud.category);if(!button)continue;const label=project(new THREE.Vector3(cloud.x,cloud.y+cloud.radius*.8,cloud.z));
      button.hidden=label.z<-1||label.z>1||label.x<0||label.x>width||label.y<55||label.y>height-70;
      button.style.transform=`translate(${label.x}px,${label.y}px) translate(-50%,-50%)`;
    }
  }
  function draw(){
    frame=0;if(disposed||document.hidden)return;
    const p=read();controls.enableDamping=!reduced.matches;
    if(flight){const t=Math.min(1,(performance.now()-flight.start)/950),ease=t*t*(3-2*t);camera.position.lerpVectors(flight.from.position,flight.to.position,ease);controls.target.lerpVectors(flight.from.target,flight.to.target,ease);if(t===1)flight=null;dirty=true;}
    controls.update();
    for(const planet of planets){
      const target=planet.targetRadius*(hover===planet.id?1.09:1),delta=target-planet.radius;
      if(Math.abs(delta)>.02){planet.radius=reduced.matches?target:planet.radius+delta*.16;dirty=true;}
      planet.body.scale.setScalar(planet.radius);planet.outline.scale.setScalar(planet.radius*1.035);planet.ring?.scale.setScalar(planet.radius);
      const show=planet.group.visible&&(p.showLabels||p.selected===planet.id||hover===planet.id||p.route[p.routeStep]===planet.id);
      if(show&&!planet.label){const food=initial.dataset.foods.find(f=>f.id===planet.id)!;const texture=makeLabelTexture(food.name);labelTextures.push(texture);const material=new THREE.SpriteMaterial({map:texture,depthTest:true,depthWrite:false});labelMaterials.push(material);planet.label=new THREE.Sprite(material);planet.label.scale.set(125,24,1);planet.group.add(planet.label);}
      if(planet.label){planet.label.visible=show;planet.label.position.set(0,-planet.radius-20,0);}
      // Keep the camera outside every visible food sphere while allowing entry into the cloud itself.
      if(planet.group.visible){const delta=camera.position.clone().sub(planet.group.position),safe=planet.radius+14;if(delta.length()<safe){camera.position.copy(planet.group.position).add(delta.lengthSq()?delta.setLength(safe):new THREE.Vector3(0,0,safe));dirty=true;}}
    }
    if(controls.target.length()>8500){const displacement=controls.target.clone().setLength(8500).sub(controls.target);controls.target.add(displacement);camera.position.add(displacement);dirty=true;}
    if(dirty){
      const distance=camera.position.distanceTo(controls.target);(scene.fog as THREE.Fog).near=Math.max(2500,distance*1.1);(scene.fog as THREE.Fog).far=Math.max(9500,distance*2.8);
      camera.updateMatrixWorld();scene.updateMatrixWorld(true);renderer.render(scene,camera);publish();dirty=false;
    }
    frame=requestAnimationFrame(draw);
  }
  const resize=new ResizeObserver(entries=>{const bounds=entries[0].contentRect;if(!bounds.width||!bounds.height)return;const changed=width!==bounds.width||height!==bounds.height;width=bounds.width;height=bounds.height;renderer.setPixelRatio(Math.min(devicePixelRatio||1,width<600?1.25:1.5));renderer.setSize(width,height,false);updateView();const selected=read().selected;if(changed&&selected&&byId.has(selected))focusFood(byId.get(selected)!);});resize.observe(canvas);
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{dirty=true;if(!frame)frame=requestAnimationFrame(draw);}};document.addEventListener('visibilitychange',visibility);
  const motion=()=>{stopInertia();if(reduced.matches&&flight){const target=flight.to;flight=null;apply(target);}dirty=true;};reduced.addEventListener('change',motion);
  canvas.dataset.world=JSON.stringify(initial.positions.map(({id,x,y,z})=>({id,x,y,z})));
  canvas.style.cursor='grab';sync();frame=requestAnimationFrame(draw);
  return {
    sync,
    home(){flight=null;saved=null;apply(home);read().onSelect(null);dirty=true;},
    overview(){saved=null;read().onSelect(null);framePoints(initial.positions.map(p=>new THREE.Vector3(p.x,p.y,p.z)),180);},
    restore,
    category(category){saved=null;focusCategory(category);},
    dolly(factor){flight=null;stopInertia();const offset=camera.position.clone().sub(controls.target),distance=THREE.MathUtils.clamp(offset.length()/factor,controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(offset.setLength(distance));controls.update();dirty=true;},
    dispose(){
      disposed=true;cancelAnimationFrame(frame);resize.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motion);
      canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerEnd);canvas.removeEventListener('pointercancel',pointerEnd);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('webglcontextlost',lost);
      controls.removeEventListener('start',start);controls.removeEventListener('change',change);controls.dispose();clearEdges();sphere.dispose();ringGeometry.dispose();art.dispose();starGeometry.dispose();starMaterial.dispose();starTexture.dispose();labelTextures.forEach(t=>t.dispose());labelMaterials.forEach(m=>m.dispose());scene.clear();renderer.dispose();renderer.forceContextLoss();
    }
  };
}
