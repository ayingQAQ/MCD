import { useState } from 'react';
import { getFoodImage, type FoodImage } from '../data/foodImages';
import type { FoodPlanet } from '../data/schema';

const unavailable = '暂无已核实商品图片';

export function FoodPhoto({ food, compact = false }: { food: Pick<FoodPlanet, 'id' | 'name'>; compact?: boolean }) {
  const image = getFoodImage(food.id);
  return <ProductPhoto key={`${food.id}:${image?.src ?? ''}`} name={food.name} image={image} compact={compact}/>;
}

function ProductPhoto({ name, image, compact }: { name: string; image?: FoodImage; compact: boolean }) {
  const [failed, setFailed] = useState(false);
  const available = image && !failed;
  const content = available
    ? <img src={image.src} alt={`${image.menuName}商品图片`} loading={compact ? 'lazy' : 'eager'} decoding="async" onError={() => setFailed(true)}/>
    : <span className="food-photo-placeholder" role="img" aria-label={`${name}：${unavailable}`}><span aria-hidden="true">{unavailable}</span></span>;
  const className = `food-photo${compact ? ' food-photo-compact' : ''}${available ? '' : ' food-photo-unavailable'}`;
  if (compact) return <span className={className}>{content}</span>;
  return <figure className={className}>
    {content}
    <figcaption className="food-photo-caption">{available
      ? <>商品图片 · {image.menuName}{image.match === 'alias' ? '（已核实名称对应）' : ''}{image.note && <span> · {image.note}</span>}</>
      : unavailable}</figcaption>
  </figure>;
}
