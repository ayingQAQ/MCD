import { useEffect, useRef, useState } from 'react';
import { categoryNames, nutrientNames, type FoodCategory } from '../data/schema';
import { clusterVolumes } from '../graph/layout';
import type { GalaxySceneInput, SceneController } from '../galaxy/scene';
import { Icon } from './Illustrations';
interface Props extends GalaxySceneInput {fitKey?:string|number|boolean;onCategoryFocus?:(category:FoodCategory)=>void}

/** React owns the existing UI; Three owns world geometry, camera, projection and picking. */
export function GalaxyCanvas(props:Props){
  const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(props),controller=useRef<SceneController|null>(null);
  latest.current=props;
  const labels=useRef(new Map<FoodCategory,HTMLButtonElement>());
  const [status,setStatus]=useState({zoom:100,focused:false}),[error,setError]=useState(''),[ready,setReady]=useState(false);
  useEffect(()=>{
    let cancelled=false;
    import('../galaxy/scene').then(({createGalaxyScene})=>{
      if(cancelled)return;
      try{controller.current=createGalaxyScene(canvas.current!,()=>latest.current,labels.current,(zoom,focused)=>setStatus({zoom,focused}),setError);setReady(true);}
      catch(reason){setError(reason instanceof Error&&reason.message.includes('WebGL')?'当前浏览器无法创建 WebGL2 三维场景。请开启图形加速或使用支持 WebGL2 的浏览器；左侧餐品目录和搜索仍可使用。':'三维场景未能载入，请重试；餐品目录仍可使用。');}
    }).catch(()=>{if(!cancelled)setError('三维渲染模块未能下载，请重新载入。');});
    return()=>{cancelled=true;controller.current?.dispose();controller.current=null;};
  },[props.dataset,props.positions]);
  useEffect(()=>{controller.current?.sync();},[props.selected,props.lens,props.visible,props.route,props.routeStep,props.showRelations,props.expanded,props.showLabels,props.highlight,props.category,props.fitKey]);
  return <>
    <canvas ref={canvas} className="galaxy-canvas" data-scene="webgl-3d" data-lens={props.lens} role="img" aria-label={`三维餐品营养星系，当前透镜：${nutrientNames[props.lens]}。左键旋转，右键平移，滚轮推进。可使用左侧餐品列表进行键盘探索。`}/>
    {!ready&&!error&&<div className="webgl-loading" role="status">正在展开三维美食宇宙…</div>}
    {error&&<section className="webgl-error paper" role="alert"><h2>三维星空暂时不可用</h2><p>{error}</p><button className="button" onClick={()=>location.reload()}>重新载入三维星系</button></section>}
    <div className="cluster-labels">{clusterVolumes(props.positions).map(cluster=><button hidden key={cluster.category} ref={element=>{if(element)labels.current.set(cluster.category,element);else labels.current.delete(cluster.category);}} aria-label={`进入${categoryNames[cluster.category]}`} onClick={()=>{props.onCategoryFocus?.(cluster.category);controller.current?.category(cluster.category);}}><span>{categoryNames[cluster.category]}</span><small>{cluster.count} 颗 · 进入星团 ↗</small></button>)}</div>
    <div className="canvas-hint"><span className="tiny-orbit"/> 左键旋转 · 右键平移 · 滚轮穿梭 · 双指缩放</div>
    <div className="scene-navigation"><button onClick={()=>controller.current?.overview()} aria-label="返回星系全景">星系全景</button>{status.focused&&<button onClick={()=>controller.current?.restore()} aria-label="返回漫游视角">↶ 返回漫游</button>}</div>
    <div className="zoom-tools" aria-label="画布视图控制"><button onClick={()=>controller.current?.dolly(.8)} aria-label="缩小">−</button><span>{status.zoom}%</span><button onClick={()=>controller.current?.dolly(1.25)} aria-label="放大">+</button><i/><button onClick={()=>controller.current?.home()} aria-label="重置视图"><Icon name="reset" size={17}/></button></div>
  </>;
}
