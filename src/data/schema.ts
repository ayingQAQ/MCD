import { z } from 'zod';

export const nutrientKeys = ['kcal', 'proteinG', 'fatG', 'carbsG', 'sodiumMg'] as const;
export type NutrientKey = typeof nutrientKeys[number];
export const categories = ['burger', 'breakfast', 'side', 'drink', 'dessert', 'other'] as const;
export type FoodCategory = typeof categories[number];
export const categoryNames: Record<FoodCategory, string> = { burger: '汉堡星系', breakfast: '早安星系', side: '小食星系', drink: '饮品星系', dessert: '甜点星系', other: '未知星域' };
export const nutrientNames: Record<NutrientKey, string> = { kcal: '热量', proteinG: '蛋白质', fatG: '脂肪', carbsG: '碳水', sodiumMg: '钠' };
const number = z.number().finite().nonnegative().nullable();
const nutritionSchema = z.object({ kcal: number, proteinG: number, fatG: number, carbsG: number, sodiumMg: number, calciumMg: number });
export const foodSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), category: z.enum(categories),
  categorySource: z.enum(['official', 'inferred', 'unknown']), nutrition: nutritionSchema,
  basis: z.object({ status: z.enum(['verified', 'unverified']), description: z.string(), unitsVerified: z.boolean() }),
  provenance: z.object({ provider: z.enum(['mcd-mcp', 'synthetic-demo']), tool: z.string().nullable(), fetchedAt: z.string().nullable(), originalName: z.string(), duplicateCount: z.number().int().positive() }),
});
export const datasetSchema = z.object({
  meta: z.object({ mode: z.enum(['official-snapshot', 'synthetic-demo']), source: z.string(), fetchedAt: z.string().nullable(), schemaVersion: z.literal('1.0'), rawCount: z.number().int().nonnegative(), count: z.number().int().nonnegative(), algorithmVersion: z.literal('1.0') }),
  foods: z.array(foodSchema), warnings: z.array(z.string()),
}).superRefine((value, ctx) => {
  if (value.meta.count !== value.foods.length || value.meta.rawCount < value.meta.count) ctx.addIssue({ code: 'custom', message: '餐品数量与元数据不一致' });
  if (new Set(value.foods.map(f => f.id)).size !== value.foods.length) ctx.addIssue({ code: 'custom', message: '餐品 ID 重复' });
  if (value.foods.some(f => f.provenance.provider !== (value.meta.mode === 'official-snapshot' ? 'mcd-mcp' : 'synthetic-demo'))) ctx.addIssue({ code: 'custom', message: '数据来源不一致' });
});
export type FoodPlanet = z.infer<typeof foodSchema>;
export type Dataset = z.infer<typeof datasetSchema>;
export interface SimilarityEdge { source: string; target: string; score: number; comparableKeys: NutrientKey[]; explanation: string }
export interface NutritionGraph { nodes: FoodPlanet[]; edges: SimilarityEdge[] }

export function stableHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return hash >>> 0;
}
export function formatNutrient(food: FoodPlanet, key: NutrientKey): string {
  const value = food.nutrition[key];
  if (value === null) return '暂无数据';
  const unit = key === 'kcal' ? 'kcal' : food.basis.unitsVerified ? (key === 'sodiumMg' ? 'mg' : 'g') : '原始值';
  return `${Number(value.toFixed(1))} ${unit}`;
}
