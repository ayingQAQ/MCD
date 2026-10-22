import { expect, it } from 'vitest';
import { groupFoodVariants } from '../src/data/foodVariants';
import { datasetSchema } from '../src/data/schema';
import snapshot from '../public/data/nutrition.snapshot.json';

it('shows one drink per product, with medium as default and each original nutrient record preserved', () => {
  const foods = datasetSchema.parse(snapshot).foods;
  const variants = foods.filter(food => /^冰牛奶[大中小]杯$/.test(food.name));
  const groups = groupFoodVariants(variants);
  expect(groups).toHaveLength(1);
  expect(groups[0].name).toBe('冰牛奶');
  expect(groups[0].food.name).toBe('冰牛奶中杯');
  expect(groups[0].variants.map(food => food.name)).toEqual(['冰牛奶小杯', '冰牛奶中杯', '冰牛奶大杯']);
  expect(groups[0].variants.map(food => food.nutrition.kcal)).toEqual([147, 224, 269]);
  expect(variants).toEqual(foods.filter(food => /^冰牛奶[大中小]杯$/.test(food.name)));
  expect(groupFoodVariants(foods).find(group => group.name === '怡泉+C')?.variants.map(food => food.name)).toEqual(['中杯怡泉+C', '大杯怡泉+C']);
  expect(groupFoodVariants(foods).find(group => group.name === '鲜萃咖啡')?.variants.map(food => food.name)).toEqual(['小杯鲜萃咖啡', '大杯鲜萃咖啡']);
});

it('keeps hot/cold, dairy/oat and different flavours separate and supports a filtered size', () => {
  const foods = datasetSchema.parse(snapshot).foods;
  const groups = groupFoodVariants(foods);
  for (const name of ['冰奶铁', '热奶铁', '冰燕麦奶铁', '冰浓浓抹茶牛奶']) expect(groups.find(group => group.name === name)).toBeDefined();
  const large = foods.find(food => food.name === '冰牛奶大杯')!;
  expect(groupFoodVariants([large])[0].food).toBe(large);
  expect(groups.flatMap(group => group.variants).map(food => food.id).sort()).toEqual(foods.map(food => food.id).sort());
});
