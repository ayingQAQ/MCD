import { compareNutrition } from '../core/comparison';
import { compareFoods, compareIds, normalizeFoods } from '../graph/analysis';
import type { Dataset, FoodPlanet, FoodCategory, NutrientKey } from '../data/schema';

export const basisNote = '按接口所列规格比较；未声明每份或每100克基准，原始值不换算为g/mg，相似度不是健康评分。';

export function foodLinks(food: FoodPlanet, dataset: Dataset) {
  const link = (route: string, key: string) => {
    const params = new URLSearchParams({ [key]: food.id });
    if (dataset.meta.mode === 'synthetic-demo') params.set('demo', '1');
    return `https://mccosmos.pages.dev/${route}?${params}`;
  };
  return { atlas: link('atlas', 'food'), galaxy: link('galaxy', 'focus') };
}

export function searchFoods(dataset: Dataset, options: { query?: string; category?: FoodCategory; maxKcal?: number; sort: string; limit: number }) {
  const query = options.query?.normalize('NFC').trim().toLocaleLowerCase() ?? '';
  const foods = dataset.foods.filter(food => food.name.toLocaleLowerCase().includes(query)
    && (!options.category || food.category === options.category)
    && (options.maxKcal === undefined || food.nutrition.kcal !== null && food.nutrition.kcal <= options.maxKcal));
  foods.sort((a, b) => {
    if (options.sort === 'name') return a.name.localeCompare(b.name, 'zh-CN') || compareIds(a.id, b.id);
    const key: NutrientKey = options.sort === 'protein-desc' ? 'proteinG' : 'kcal';
    const av = a.nutrition[key], bv = b.nutrition[key];
    if (av === null) return bv === null ? compareIds(a.id, b.id) : 1;
    if (bv === null) return -1;
    return (options.sort === 'kcal-asc' ? av - bv : bv - av) || compareIds(a.id, b.id);
  });
  return { foods: foods.slice(0, options.limit), total: foods.length, links: foods.slice(0, options.limit).map(food => foodLinks(food, dataset)), basisNote };
}

export function compareRecords(dataset: Dataset, a: FoodPlanet, b: FoodPlanet) {
  return {
    foods: [a, b], rows: compareNutrition([a, b]), differenceDirection: '第二项减第一项',
    similarity: a.basis.unitsVerified === b.basis.unitsVerified ? compareFoods(a, b, normalizeFoods(dataset.foods)) : null,
    links: [foodLinks(a, dataset), foodLinks(b, dataset)], basisNote,
  };
}

export function alternativeFoods(dataset: Dataset, reference: FoodPlanet, options: { category?: FoodCategory; crossCategory: boolean; lowerKcal: boolean; maxKcal?: number; minScore: number; limit: number }) {
  // Normalize against the full dataset once, not against a changing filtered subset.
  const values = normalizeFoods(dataset.foods);
  const category = options.category ?? (options.crossCategory ? undefined : reference.category);
  const candidates = dataset.foods.flatMap(food => {
    if (food.id === reference.id || category && food.category !== category || food.basis.unitsVerified !== reference.basis.unitsVerified) return [];
    const kcal = food.nutrition.kcal, original = reference.nutrition.kcal;
    if (options.lowerKcal && (kcal === null || original === null || kcal >= original)) return [];
    if (options.maxKcal !== undefined && (kcal === null || kcal > options.maxKcal)) return [];
    const similarity = compareFoods(reference, food, values);
    if (!similarity || similarity.score < options.minScore) return [];
    return [{ food, similarity, differences: compareNutrition([reference, food]), calorieDifference: kcal === null || original === null ? null : kcal - original, links: foodLinks(food, dataset) }];
  }).sort((a, b) => b.similarity.score - a.similarity.score || compareIds(a.food.id, b.food.id));
  return { reference, candidates: candidates.slice(0, options.limit), total: candidates.length, constraints: { ...options, category: category ?? 'all' }, basisNote };
}
