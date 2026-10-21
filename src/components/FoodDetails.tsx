import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useFood } from '../state/FoodProvider';
import { PlanetDetails } from './PlanetDetails';
export function FoodDetails({foodId,onClose,onSelect,onRouteEndpoint}:{foodId:string;onClose:()=>void;onSelect?:(id:string)=>void;onRouteEndpoint?:(which:'from'|'to',id:string)=>void}) {
  const {dataset,graph,foodById,state,toggleFavorite,addToLab,visitFood,path}=useFood();const navigate=useNavigate();const food=foodById.get(foodId);
  useEffect(()=>{if(food)visitFood(food.id);},[food,visitFood]);
  // Escape closes the archive unless another layer (dialog, search) already handled it.
  useEffect(()=>{const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!event.defaultPrevented&&!document.querySelector('dialog[open]'))onClose();};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[onClose]);
  if(!food)return <aside className="planet-details paper"><h2>找不到这颗星球</h2><p>它可能已不在当前快照里。</p><button className="button" onClick={onClose}>关闭星球档案</button></aside>;
  const favorite=state.favoriteIds.includes(food.id),inLab=state.labSelectedIds.includes(food.id),labCount=state.labSelectedIds.length;
  // Inside the galaxy (onSelect given) the planet is already on the map, so only offer the other destinations.
  return <PlanetDetails food={food} dataset={dataset} graph={graph} onClose={onClose} onSelect={onSelect??(id=>navigate(path('/atlas',{food:id})))} onRouteEndpoint={onRouteEndpoint??((which,id)=>navigate(path('/galaxy',{[which]:id})))} actions={<div className="detail-cross-actions"><button className={`button${favorite?' is-on':''}`} aria-label={favorite?'取消收藏星球':'收藏星球'} aria-pressed={favorite} onClick={()=>toggleFavorite(food.id)}>{favorite?'★ 已收藏':'☆ 收藏星球'}</button>{inLab?<button className="button primary" onClick={()=>navigate(path('/lab'))}>去实验室比较 · {labCount}/3</button>:<button className="button primary" onClick={()=>addToLab(food.id)}>加入实验室</button>}{!onSelect&&<button className="text-link" onClick={()=>navigate(path('/galaxy',{focus:food.id}))}>在星图中寻找 ↗</button>}{!inLab&&<button className="text-link" onClick={()=>navigate(path('/lab'))}>前往实验室{labCount?` · ${labCount}/3`:''} ↗</button>}</div>}/>;
}
