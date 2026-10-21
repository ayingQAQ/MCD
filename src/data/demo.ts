import { categories, type Dataset, type FoodPlanet } from './schema';

export function demoDataset(): Dataset {
  const names = ['云朵小汉堡', '月亮奶酪堡', '番茄飞船堡', '晨光蛋堡', '太阳松饼', '早安小面包', '彗星薯条', '小熊鸡球', '玉米流星', '银河气泡水', '蓝星柠檬茶', '月光燕麦饮', '奶油小行星', '草莓环星', '布丁星团', '神秘卷卷', '星星小点', '宇宙探险餐'];
  const foods: FoodPlanet[] = names.map((name, i) => ({
    id: `demo-${i}`, name, category: categories[Math.floor(i / 3)], categorySource: 'inferred',
    nutrition: { kcal: i === 17 ? null : 80 + (i * 47) % 460, proteinG: (i * 3) % 30, fatG: (i * 5) % 25, carbsG: 10 + i * 2, sodiumMg: i * 43, calciumMg: i * 7 },
    basis: { status: 'verified', description: '合成示例每份，非真实营养信息', unitsVerified: true },
    provenance: { provider: 'synthetic-demo', tool: null, fetchedAt: null, originalName: name, duplicateCount: 1 },
  }));
  return { meta: { mode: 'synthetic-demo', source: '本地确定性合成示例', fetchedAt: null, schemaVersion: '1.0', algorithmVersion: '1.0', rawCount: foods.length, count: foods.length }, foods, warnings: ['合成示例数据，非官方营养信息'] };
}
