import { describe, expect, it } from 'vitest';
import { runCli } from '../src/cli/run';
import { demoDataset } from '../src/data/demo';
import type { FoodPlanet } from '../src/data/schema';

function fixture() {
  const data = demoDataset();
  const make = (id: string, kcal: number | null, protein: number | null): FoodPlanet => ({ ...data.foods[0], id, name: id, category: 'burger', basis: { status: 'unverified', unitsVerified: false, description: '计量基准未声明' }, nutrition: { ...data.foods[0].nutrition, kcal, proteinG: protein, fatG: 10, carbsG: 20, sodiumMg: 300 } });
  data.foods = [make('reference', 400, 20), make('lighter', 300, 18), make('zero', 0, 0), make('missing', null, null), make('higher', 600, 22)];
  data.meta.count = data.meta.rawCount = data.foods.length;
  return data;
}

describe('Skill nutrition workflows', () => {
  it('compares named records with original units, signed differences, names and deep links', () => {
    const result = runCli(['compare', '--from=reference', '--to=lighter'], fixture());
    expect(result.ok).toBe(true);
    const data = result.data as { foods: FoodPlanet[]; rows: { key: string; values: number[]; unit: string; delta: number | null }[]; links: { atlas: string; galaxy: string }[] };
    expect(data.foods.map(food => food.name)).toEqual(['reference', 'lighter']);
    expect(data.rows.find(row => row.key === 'kcal')).toMatchObject({ values: [400, 300], delta: -100, unit: 'kcal' });
    expect(data.rows.find(row => row.key === 'proteinG')).toMatchObject({ delta: -2, unit: '原始值' });
    expect(data.links[0].atlas).toContain('food=reference');
    expect(data.links[0].galaxy).toContain('demo=1');
  });
  it('does not compare missing values as zero and does not mix known units and raw values', () => {
    const data = fixture(); data.foods[1].basis.unitsVerified = true;
    const result = runCli(['compare', '--from-id=reference', '--to-id=lighter'], data);
    const rows = (result.data as { rows: { key: string; comparable: boolean; delta: number | null }[] }).rows;
    expect(rows.find(row => row.key === 'proteinG')).toMatchObject({ comparable: false, delta: null });
    const missing = runCli(['compare', '--from=reference', '--to=missing'], data);
    expect((missing.data as { rows: { delta: number | null }[] }).rows[0].delta).toBeNull();
  });
  it('filters and sorts calorie evidence without dropping a real zero or including missing calories', () => {
    const result = runCli(['search', '--category=burger', '--max-kcal=300', '--sort=kcal-asc', '--limit=10'], fixture());
    expect(result.ok).toBe(true);
    expect((result.data as { foods: FoodPlanet[] }).foods.map(food => food.id)).toEqual(['zero', 'lighter']);
    expect((runCli(['search', '--query=miss'], fixture()).data as { foods: FoodPlanet[] }).foods.map(food => food.id)).toEqual(['missing']);
    expect((runCli(['search', '--max-kcal=0'], fixture()).data as { foods: FoodPlanet[] }).foods.map(food => food.id)).toEqual(['zero']);
  });
  it('ranks lower calorie alternatives using actual candidates and respects all constraints', () => {
    const result = runCli(['alternatives', '--name=reference', '--lower-kcal', '--max-kcal=300', '--min-score=0'], fixture());
    expect(result.ok).toBe(true);
    const data = result.data as { reference: FoodPlanet; candidates: { food: FoodPlanet; calorieDifference: number; similarity: { score: number } }[] };
    expect(data.reference.id).toBe('reference');
    expect(data.candidates.map(item => item.food.id).sort()).toEqual(['lighter', 'zero']);
    expect(data.candidates[0].similarity.score).toBeGreaterThanOrEqual(data.candidates[1].similarity.score);
    expect(data.candidates.find(item => item.food.id === 'lighter')?.calorieDifference).toBe(-100);
  });
  it('returns an empty result rather than relaxing constraints, and fails a lower-calorie request with an unknown baseline', () => {
    expect(runCli(['alternatives', '--name=zero', '--lower-kcal'], fixture())).toMatchObject({ ok: true, data: { candidates: [], total: 0 } });
    expect(runCli(['alternatives', '--name=missing', '--lower-kcal'], fixture())).toMatchObject({ ok: false, error: { code: 'MISSING_BASELINE' } });
  });
  it('keeps temperature and cup records distinct and asks for disambiguation', () => {
    const data = fixture(); data.foods[1].name = 'reference';
    expect(runCli(['compare', '--from=reference', '--to=zero'], data)).toMatchObject({ ok: false, error: { code: 'AMBIGUOUS', candidates: expect.arrayContaining([{ id: 'lighter', name: 'reference' }]) } });
    expect(runCli(['compare', '--from-id=reference', '--to-id=zero'], data).ok).toBe(true);
  });
  it('rejects invalid numeric values, categories and unrelated options rather than ignoring a requested constraint', () => {
    for (const args of [['search', '--max-kcal='], ['search', '--max-kcal=NaN'], ['search', '--max-kcal=-1'], ['search', '--sort=magic'], ['alternatives', '--name=reference', '--min-score=101'], ['search', '--category=magic'], ['compare', '--from=reference', '--to=zero', '--max-kcal=300']]) {
      expect(runCli(args, fixture()), args.join(' ')).toMatchObject({ ok: false, error: { code: 'INVALID_ARGUMENT' } });
    }
  });
});
