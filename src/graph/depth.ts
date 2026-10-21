export interface SceneCamera { x: number; y: number; scale: number }
export interface Viewport { width: number; height: number }
export interface DepthPoint { x: number; y: number; depth?: number }
export interface ProjectedPoint { x: number; y: number; factor: number }
/** Artistic camera distance, unrelated to nutrition or similarity. */
export function depthFactor(depth = 0): number {
  return 1 / (1 + Math.max(-.6, Math.min(1.8, Number.isFinite(depth) ? depth : 0)) * .55);
}
export function projectPoint(point: DepthPoint, camera: SceneCamera, viewport: Viewport): ProjectedPoint {
  const factor = depthFactor(point.depth), cx = viewport.width / 2, cy = viewport.height / 2;
  return { x: cx + (point.x * camera.scale + camera.x - cx) * factor, y: cy + (point.y * camera.scale + camera.y - cy) * factor, factor };
}
export function unprojectPoint(point: {x:number;y:number}, depth: number, camera: SceneCamera, viewport: Viewport): {x:number;y:number} {
  const factor = depthFactor(depth), cx = viewport.width / 2, cy = viewport.height / 2;
  return {x:(cx + (point.x-cx)/factor-camera.x)/camera.scale,y:(cy+(point.y-cy)/factor-camera.y)/camera.scale};
}
export function zoomCameraAt(camera:SceneCamera,anchor:{x:number;y:number},factor:number,viewport:Viewport,depth=0):SceneCamera {
  const world = unprojectPoint(anchor,depth,camera,viewport), scale = Math.max(.2,Math.min(2.6,camera.scale*factor));
  const f=depthFactor(depth),cx=viewport.width/2,cy=viewport.height/2;
  return {x:cx+(anchor.x-cx)/f-world.x*scale,y:cy+(anchor.y-cy)/f-world.y*scale,scale};
}
/** Frame projected bounds inside uncovered screen space, including varying depth. */
export function frameDepthPoints(points:DepthPoint[],viewport:Viewport,area:{left:number;top:number;width:number;height:number},maxScale=1):SceneCamera {
  let camera:SceneCamera={x:viewport.width/2,y:viewport.height/2,scale:maxScale};
  if(!points.length)return camera;
  const target={x:area.left+area.width/2,y:area.top+area.height/2};
  for(let pass=0;pass<14;pass++){
    const projected=points.map(p=>projectPoint(p,camera,viewport));
    const minX=Math.min(...projected.map(p=>p.x-50*p.factor*camera.scale)),maxX=Math.max(...projected.map(p=>p.x+50*p.factor*camera.scale));
    const minY=Math.min(...projected.map(p=>p.y-50*p.factor*camera.scale)),maxY=Math.max(...projected.map(p=>p.y+50*p.factor*camera.scale));
    const mean=projected.reduce((s,p)=>s+p.factor,0)/projected.length;
    camera.x+=(target.x-(minX+maxX)/2)/mean;camera.y+=(target.y-(minY+maxY)/2)/mean;
    const ratio=Math.min(1,(area.width-32)/(maxX-minX),(area.height-32)/(maxY-minY));
    if(ratio<.999)camera={...camera,scale:Math.max(.2,camera.scale*ratio)};
  }
  return camera;
}
