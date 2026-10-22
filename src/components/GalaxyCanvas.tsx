import { useEffect, useMemo, useRef, useState } from 'react';
import { categoryNames, nutrientNames, type FoodCategory } from '../data/schema';
import { clusterVolumes } from '../graph/layout';
import type { GalaxySceneInput, PlanetHover, SceneController } from '../galaxy/scene';
import { Icon } from './Illustrations';
interface Props extends GalaxySceneInput {fitKey?:string|number|boolean;onCategoryFocus?:(category:FoodCategory)=>void;onOverview?:()=>void}

/** React owns the existing UI; Three owns world geometry, camera, projection and picking. */
export function GalaxyCanvas(props:Props){
  const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(props),controller=useRef<SceneController|null>(null);
  latest.current=props;
  const labels=useRef(new Map<FoodCategory,HTMLButtonElement>());
  const clusters=useMemo(()=>clusterVolumes(props.positions),[props.positions]);
  const [status,setStatus]=useState<{zoom:number;focused:boolean;hovered:PlanetHover|null}>({zoom:100,focused:false,hovered:null}),[error,setError]=useState(''),[ready,setReady]=useState(false);
  useEffect(()=>{
    let cancelled=false;
    import('../galaxy/scene').then(({createGalaxyScene})=>{
      if(cancelled)return;
      try{controller.current=createGalaxyScene(canvas.current!,()=>latest.current,labels.current,(zoom,focused,hovered)=>setStatus({zoom,focused,hovered}),setError);setReady(true);}
      catch(reason){setError(reason instanceof Error&&reason.message.includes('WebGL')?'当前浏览器无法创建 WebGL2 三维场景。请开启图形加速或使用支持 WebGL2 的浏览器；左侧餐品目录和搜索仍可使用。':'三维场景未能载入，请重试；餐品目录仍可使用。');}
    }).catch(()=>{if(!cancelled)setError('三维渲染模块未能下载，请重新载入。');});
    return()=>{cancelled=true;controller.current?.dispose();controller.current=null;};
  },[props.dataset,props.positions]);
  useEffect(()=>{controller.current?.sync();},[props.selected,props.lens,props.visible,props.route,props.routeStep,props.showRelations,props.expanded,props.showLabels,props.highlight,props.category,props.categoryFocusKey,props.fitKey]);
  return <>
    <canvas ref={canvas} className="galaxy-canvas" data-scene="webgl-3d" data-lens={props.lens} role="img" tabIndex={0} aria-describedby="galaxy-gesture-help" aria-label={`三维餐品营养星系，当前透镜：${nutrientNames[props.lens]}。左键旋转，右键平移，滚轮推进。可使用左侧餐品列表进行键盘探索。`}/>
    {!ready&&!error&&<div className="webgl-loading" role="status">正在展开三维美食宇宙…</div>}
    {error&&<section className="webgl-error paper" role="alert"><h2>三维星空暂时不可用</h2><p>{error}</p><button className="button" onClick={()=>location.reload()}>重新载入三维星系</button></section>}
    <div className="cluster-labels">{clusters.map(cluster=><button hidden key={cluster.category} ref={element=>{if(element)labels.current.set(cluster.category,element);else labels.current.delete(cluster.category);}} aria-label={`进入${categoryNames[cluster.category]}`} onClick={()=>{if(props.onCategoryFocus)props.onCategoryFocus(cluster.category);else controller.current?.category(cluster.category);}}><span>{categoryNames[cluster.category]}</span><small>{cluster.count} 颗 ↗</small></button>)}</div>
    {status.hovered&&<div className="planet-hover-card" role="tooltip" style={{left:status.hovered.x,top:status.hovered.y}}><strong>{status.hovered.name}</strong><small>点击靠近 · 查看营养</small></div>}
    <div id="galaxy-gesture-help" className="canvas-hint"><span className="tiny-orbit"/> 拖动旋转 · 右键平移 · 滚轮跟随鼠标靠近 · 方向键平移</div>
    <div className="scene-controls" role="group" aria-label="星系视角工具栏">
    <div className="scene-navigation"><button onClick={()=>{props.onOverview?.();controller.current?.overview();}} aria-label="返回星系全景">星系全景</button>{status.focused&&<button onClick={()=>controller.current?.restore()} aria-label="返回漫游视角">↶ 返回漫游</button>}</div>
    <div className="zoom-tools" aria-label="画布视图控制"><button onClick={()=>controller.current?.dolly(.8)} aria-label="缩小">−</button><span>{status.zoom}%</span><button onClick={()=>controller.current?.dolly(1.25)} aria-label="放大">+</button><i/><button onClick={()=>controller.current?.home()} aria-label="重置视图" title="回到初始漫游视角"><Icon name="reset" size={17}/></button></div></div>
  </>;
}
