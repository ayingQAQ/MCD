import { FoodIllustration, resolveFoodIllustration } from './food-illustrations';
import { categoryNames, formatNutrient, type FoodPlanet } from '../data/schema';
import { useFood } from '../state/FoodProvider';
export function FoodCard({food,onOpen}:{food:FoodPlanet;onOpen:()=>void}) {
  const {state,toggleFavorite,addToLab}=useFood();const favorite=state.favoriteIds.includes(food.id);
  return <article className={`food-card paper food-card-${food.category}`}>
    <button className="food-card-open" onClick={onOpen} aria-label={`查看 ${food.name}`}><span className="food-card-orbit"/><FoodIllustration foodId={resolveFoodIllustration(food).presetId} size={128} decorative/><span className="food-card-category">{categoryNames[food.category]}</span><h2>{food.name}</h2><strong>{formatNutrient(food,'kcal')}</strong><small>蛋白质 {formatNutrient(food,'proteinG')}</small></button>
    <div className="food-card-actions"><button aria-label={`${favorite?'取消收藏':'收藏'} ${food.name}`} aria-pressed={favorite} onClick={()=>toggleFavorite(food.id)}>{favorite?'已收藏':'收藏星球'}</button><button aria-label={`实验室添加 ${food.name}`} onClick={()=>addToLab(food.id)}>＋ 实验室</button></div>
    <span className="food-card-note">分类为项目推断 · 插画为通用示意</span>
  </article>;
}
