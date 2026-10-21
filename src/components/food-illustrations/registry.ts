import type { FoodIdentity, FoodIllustrationPreset, IllustrationMatch } from './types';
import { foodPresets } from './presets/foods';
const presets = new Map(foodPresets.map(preset => [preset.id, preset]));
const aliases: Record<string, string> = { 'big-mac': 'burger-layered' };
export function getFoodIllustrationPreset(id?: string): FoodIllustrationPreset {
  return presets.get(id ? aliases[id] ?? id : 'unknown-bag') ?? presets.get('unknown-bag')!;
}
/** Only shape/name/category evidence is accepted here; nutrition is intentionally absent. */
export function resolveFoodIllustration(food: FoodIdentity): IllustrationMatch {
  const match = (presetId: string, reason: IllustrationMatch['reason']): IllustrationMatch => ({ presetId, reason, status: 'generic-example', note: '按餐品形态选择的通用示意，不代表实际商品配方。' });
  if (food.id && presets.has(food.id)) return match(food.id, 'preset');
  const name = food.name.trim();
  if (/薯条/.test(name)) return match(/迷你|小/.test(name) ? 'fries-small' : /大/.test(name) ? 'fries-large' : 'fries-regular', 'name-shape');
  if (/鸡块/.test(name)) return match('nugget-box', 'name-shape');
  if (/甜筒|圆筒冰淇淋/.test(name)) return match('dessert-cone', 'name-shape');
  if (/派$/.test(name)) return match('dessert-pie', 'name-shape');
  if (/新地/.test(name)) return match(/草莓/.test(name) ? 'dessert-sundae' : 'dessert-plain-cup', 'name-shape');
  if (/麦旋风/.test(name)) return match('dessert-cookie', 'name-shape');
  if (/麦满分/.test(name)) return match(/蛋/.test(name) ? 'breakfast-egg-muffin' : 'breakfast-muffin', 'name-shape');
  if (/卷/.test(name)) return match(/鸡/.test(name) ? 'wrap-open' : 'wrap-closed', 'name-shape');
  if (/双层.*(?:牛|汉堡)/.test(name)) return match('burger-double', 'name-shape');
  if (/(?:脆|酥|炸).*鸡.*(?:堡|汉堡)/.test(name)) return match('burger-crispy', 'name-shape');
  // A chicken sandwich name alone does not establish a fried coating or a beef filling.
  if (/鸡.*(?:堡|汉堡)/.test(name)) return match('unknown-bag', 'unknown');
  if (/麦香鸡|麦香鱼|鱼.*(?:堡|汉堡)/.test(name)) return match('unknown-bag', 'unknown');
  if (/吉士.*汉堡/.test(name)) return match('burger-cheese', 'name-shape');
  if (/汉堡|牛堡|鸡腿堡/.test(name)) return match('burger-single', 'name-shape');
  if (/热.*(?:饮|奶|茶|咖啡)|热朱古力/.test(name)) return match('drink-hot', 'name-shape');
  if (/浓缩咖啡/.test(name)) return match('drink-espresso', 'name-shape');
  if (/可乐|雪碧|冷饮/.test(name)) return match('drink-cola', 'name-shape');
  if (food.category === 'burger') return match('burger-single', 'category');
  if (food.category === 'drink' && !/盒装|瓶装/.test(name)) return match('drink-cola', 'category');
  // Side/breakfast/dessert categories are too broad to prove nuggets/muffins/ice cream.
  return match('unknown-bag', 'unknown');
}
