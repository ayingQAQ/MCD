import type { FoodPlanet } from './schema';

export interface FoodGroup { name: string; food: FoodPlanet; variants: FoodPlanet[] }
/** Group only explicit beverage cup sizes; never merge temperature, flavour or milk base. */
export function drinkVariant(food: Pick<FoodPlanet, 'category' | 'name'>) {
  if (food.category !== 'drink') return null;
  const suffix = /^(.*?)([小中大])杯$/.exec(food.name);
  const prefix = /^([小中大])杯(.+)$/.exec(food.name);
  const name = suffix?.[1] ?? prefix?.[2], size = suffix?.[2] ?? prefix?.[1];
  return name && size ? { name, size: `${size}杯`, order: ['小', '中', '大'].indexOf(size) } : null;
}

export function groupFoodVariants(foods: FoodPlanet[]): FoodGroup[] {
  const groups = new Map<string, FoodGroup>();
  for (const food of foods) {
    const variant = drinkVariant(food), key = variant ? `drink:${variant.name}` : food.id;
    const group = groups.get(key);
    if (group) group.variants.push(food);
    else groups.set(key, { name: variant?.name ?? food.name, food, variants: [food] });
  }
  for (const group of groups.values()) {
    group.variants.sort((a, b) => (drinkVariant(a)?.order ?? 0) - (drinkVariant(b)?.order ?? 0));
    group.food = group.variants.find(food => drinkVariant(food)?.size === '中杯') ?? group.variants[0];
  }
  return [...groups.values()];
}
