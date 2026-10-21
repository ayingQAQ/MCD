import {expect,it} from 'vitest';
import {depthFactor,projectPoint,unprojectPoint,zoomCameraAt} from '../src/graph/depth';
const viewport={width:1200,height:800},camera={x:600,y:400,scale:.6};
it('has bounded near, middle and far depth planes',()=>{
  expect(depthFactor(-.4)).toBeGreaterThan(1);
  expect(depthFactor(.9)).toBeLessThan(.8);
  expect(depthFactor(0)).toBe(1);
  for(const depth of [-100,100,Infinity,NaN])expect(Number.isFinite(depthFactor(depth))).toBe(true);
});
it('foreground moves farther than background under the same camera pan',()=>{
  const moved={...camera,x:camera.x+100};
  const near=projectPoint({x:50,y:50,depth:-.4},camera,viewport),nearMoved=projectPoint({x:50,y:50,depth:-.4},moved,viewport);
  const far=projectPoint({x:50,y:50,depth:1},camera,viewport),farMoved=projectPoint({x:50,y:50,depth:1},moved,viewport);
  expect(nearMoved.x-near.x).toBeGreaterThan(100);
  expect(farMoved.x-far.x).toBeLessThan(80);
});
it('inverts the visible projection at every depth for precise pointer picking',()=>{
  for(const depth of [-.4,0,.8,1.2]){
    const point={x:-320,y:178,depth},screen=projectPoint(point,camera,viewport),world=unprojectPoint(screen,depth,camera,viewport);
    expect(world.x).toBeCloseTo(point.x,8);expect(world.y).toBeCloseTo(point.y,8);
  }
});
it('keeps the pointed depth plane anchored during zoom and clamps zoom safely',()=>{
  const point={x:310,y:126,depth:.9},anchor=projectPoint(point,camera,viewport);
  const next=zoomCameraAt(camera,anchor,2,viewport,point.depth),after=projectPoint(point,next,viewport);
  expect(after.x).toBeCloseTo(anchor.x,8);expect(after.y).toBeCloseTo(anchor.y,8);
  expect(zoomCameraAt(camera,anchor,100,viewport).scale).toBe(2.6);
  expect(zoomCameraAt(camera,anchor,.0001,viewport).scale).toBe(.2);
});
