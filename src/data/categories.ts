import type { FoodCategory } from './schema';
// Local presentation rules, never represented as official product categories.
export function inferCategory(name: string): FoodCategory {
  if (/麦满分|早安|早餐|炒双蛋|粥|油条|薯饼|香肠/.test(name)) return 'breakfast';
  if (/冰淇淋|新地|麦旋风|派$|拉明顿|阿芙佳朵/.test(name)) return 'dessert';
  if (/可乐|雪碧|咖啡|奶铁|美式|玛奇朵|卡布奇诺|红茶|朱古力$|牛奶|燕麦奶|豆浆|果汁|苹果汁|雪冰|抹茶|黑巧|纯悦|怡泉|橙橙|柠檬|yeye|麦旋酷/.test(name) && !/翅|鸡|堡/.test(name)) return 'drink';
  if (/汉堡|堡$|巨无霸|麦香鸡|麦香鱼|安格斯/.test(name)) return 'burger';
  if (/薯条|玉米|鸡|翅|苹果片|鱼排/.test(name)) return 'side';
  return 'other';
}
