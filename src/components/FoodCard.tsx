import { FoodPhoto } from './FoodPhoto';
import { categoryNames, formatNutrient, type FoodPlanet } from '../data/schema';
import { useFood } from '../state/FoodProvider';
export function FoodCard({food,onOpen,current=false}:{food:FoodPlanet;onOpen:()=>void;current?:boolean}) {
  const {state,toggleFavorite,addToLab,removeFromLab}=useFood();const favorite=state.favoriteIds.includes(food.id),inLab=state.labSelectedIds.includes(food.id);
  return <article className={`food-card paper food-card-${food.category}${current?' is-current':''}`}>
    <button className="food-card-open" onClick={onOpen} aria-label={`查看 ${food.name}`} aria-current={current||undefined}><span className="food-card-orbit"/><FoodPhoto food={food} compact/><span className="food-card-category">{categoryNames[food.category]}</span><h2>{food.name}</h2><strong>{formatNutrient(food,'kcal')}</strong><small>蛋白质 {formatNutrient(food,'proteinG')}</small></button>
    <div className="food-card-actions"><button aria-label={`${favorite?'取消收藏':'收藏'} ${food.name}`} aria-pressed={favorite} onClick={()=>toggleFavorite(food.id)}>{favorite?'★ 已收藏':'☆ 收藏'}</button><button aria-label={inLab?`实验室移除 ${food.name}`:`实验室添加 ${food.name}`} aria-pressed={inLab} onClick={()=>inLab?removeFromLab(food.id):addToLab(food.id)}>{inLab?'✓ 在实验台':'＋ 实验室'}</button></div>
  </article>;
}
