export interface SceneCamera { x: number; y: number; scale: number }
export interface Viewport { width: number; height: number }
export interface DepthPoint { x: number; y: number; depth?: number }
export interface ProjectedPoint { x: number; y: number; factor: number }
export function depthFactor(_depth = 0): number { void _depth; return 1; }
export function projectPoint(point: DepthPoint, camera: SceneCamera, _viewport: Viewport): ProjectedPoint { void _viewport; return {x:point.x*camera.scale+camera.x,y:point.y*camera.scale+camera.y,factor:1}; }
export function unprojectPoint(point: {x:number;y:number}, _depth: number, camera: SceneCamera, _viewport: Viewport): {x:number;y:number} {void _depth;void _viewport;return {x:(point.x-camera.x)/camera.scale,y:(point.y-camera.y)/camera.scale};}
export function zoomCameraAt(camera:SceneCamera,anchor:{x:number;y:number},factor:number,viewport:Viewport,depth=0):SceneCamera {void anchor;void viewport;void depth;return {...camera,scale:camera.scale*factor};}
