import { describe, expect, it } from 'vitest';
import { parseNutritionResponse } from '../src/mcp/nutrition-adapter';

const header = 'productName,nutritionDescription,energyKj,energyKcal,protein,fat,carbohydrate,sodium,calcium';
const row = '测试餐品,null,418.4,100,10,2,12,100,20';
const response = (rows: string[], count = rows.length) => ({ structuredContent: { success: true, code: 200, data: `[${count}]{${header}}:\n${rows.map(r => `  ${r}`).join('\n')}` } });
describe('nutrition response', () => {
  it('deduplicates exact rows while preserving zero and honest provenance', () => {
    const dataset = parseNutritionResponse(response([row, row, '清水,null,0,0,0,0,0,0,0']), '2026-10-21T00:00:00Z');
    expect(dataset.meta).toMatchObject({ rawCount: 3, count: 2, mode: 'official-snapshot' });
    expect(dataset.foods.find(f => f.name === '清水')?.nutrition.kcal).toBe(0);
    expect(dataset.foods[0].basis.status).toBe('unverified');
    expect(dataset.foods[0].provenance.provider).toBe('mcd-mcp');
  });
  it('preserves same-name conflicts with distinct stable IDs', () => {
    const a = parseNutritionResponse(response([row, row.replace(',100,10,', ',101,10,')]));
    const b = parseNutritionResponse(response([row.replace(',100,10,', ',101,10,'), row]));
    expect(new Set(a.foods.map(f => f.id)).size).toBe(2);
    expect(a.foods.map(f => f.id).sort()).toEqual(b.foods.map(f => f.id).sort());
  });
  it('maps invalid and missing nutrients to null, never zero', () => {
    const data = parseNutritionResponse(response(['坏数据,null,0,null,-1,NaN,4,0,0']));
    expect(data.foods[0].nutrition).toMatchObject({ kcal: null, proteinG: null, fatG: null, sodiumMg: 0 });
    expect(data.warnings.length).toBeGreaterThan(0);
  });
  it('rejects incorrect counts, tool errors, and unknown formats', () => {
    expect(() => parseNutritionResponse(response([row], 2))).toThrow();
    expect(() => parseNutritionResponse({ isError: true, content: [] })).toThrow();
    expect(() => parseNutritionResponse({ structuredContent: { success: true, code: 200, data: 'unknown' } })).toThrow();
  });
  it('supports the observed text envelope when structured content is absent', () => {
    const original = response([row]).structuredContent;
    const result = parseNutritionResponse({ content: [{ type: 'text', text: `## Original Response\n\n${JSON.stringify(original)}` }] });
    expect(result.foods[0].nutrition.kcal).toBe(100);
  });
  it('preserves quoted commas and Chinese names', () => {
    const result = parseNutritionResponse(response([row.replace('测试餐品', '"测试,餐品"')]));
    expect(result.foods[0].name).toBe('测试,餐品');
  });
  it('does not derive per-serving kcal from kJ when the quantity basis is unverified', () => {
    const result = parseNutritionResponse(response(['计量待确认,null,418.4,null,1,2,3,4,5']));
    expect(result.foods[0].nutrition.kcal).toBeNull();
    expect(result.foods[0].basis.unitsVerified).toBe(false);
  });
});
