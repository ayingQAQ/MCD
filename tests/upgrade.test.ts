import { describe, it, expect } from 'vitest';
import { demoDataset } from '../src/data/demo';
import { analyze, findRoute } from '../src/graph/analysis';
import { compareNutrition } from '../src/core/comparison';
import { createDailyQuests, datasetVersion, localDateKey, validateQuest } from '../src/core/quests';
import { readPersistentState } from '../src/state/persistence';

describe('2.0 interaction rules', () => {
  it('compares five separate raw dimensions, preserves zero and missing values', () => {
    const [a,b] = structuredClone(demoDataset().foods);
    a.nutrition.kcal = 0; b.nutrition.kcal = 10; a.nutrition.proteinG = null;
    const rows = compareNutrition([a,b]);
    expect(rows).toHaveLength(5);
    expect(rows.find(r=>r.key==='kcal')).toMatchObject({ values:[0,10], delta:10, unit:'kcal', comparable:true });
    expect(rows.find(r=>r.key==='proteinG')).toMatchObject({ delta:null, comparable:false });
  });
  it('does not label unverified units as g or compare incompatible units', () => {
    const [a,b] = structuredClone(demoDataset().foods); a.basis.unitsVerified=false; b.basis.unitsVerified=false;
    expect(compareNutrition([a,b]).find(r=>r.key==='proteinG')?.unit).toBe('原始值');
    b.basis.unitsVerified=true;
    expect(compareNutrition([a,b]).find(r=>r.key==='proteinG')?.comparable).toBe(false);
  });
  it('recovers corrupt storage, filters stale ids and bounds selections', () => {
    expect(readPersistentState('{broken', ['a']).favoriteIds).toEqual([]);
    const state=readPersistentState(JSON.stringify({version:1,favoriteIds:['a','a','bad'],labSelectedIds:['a','b','c','d'],recentlyViewed:['b','a'],questProgress:{valid:'claimed',invalid:'oops'},sound:true}),['a','b','c','d']);
    expect(state.favoriteIds).toEqual(['a']); expect(state.labSelectedIds).toEqual(['a','b','c']);
    expect(state.questProgress).toEqual({valid:'claimed'}); expect(state.sound).toBe(true);
    expect(readPersistentState(JSON.stringify({version:99,favoriteIds:['a']}),['a']).favoriteIds).toEqual([]);
  });
  it('generates three stable daily quests, each available quest has a provable solution', () => {
    const dataset=demoDataset(), graph=analyze(dataset.foods), quests=createDailyQuests(dataset,graph,'2026-10-21');
    expect(quests).toHaveLength(3); expect(quests).toEqual(createDailyQuests(dataset,graph,'2026-10-21'));
    for (const quest of quests.filter(q=>q.available)) {
      const choice=quest.type==='nutrient' ? quest.candidates.slice(0,1) : quest.pair!;
      expect(validateQuest(quest,choice,graph,quest.type==='route'?'route-planned':'check')).toBe(true);
      expect(validateQuest(quest,['not-a-food'],graph)).toBe(false);
      if(quest.type==='route') { expect(findRoute(graph,...quest.pair!)).not.toBeNull(); expect(validateQuest(quest,choice,graph)).toBe(false); }
    }
    expect(createDailyQuests(dataset,graph,'2026-10-22').map(q=>q.id)).not.toEqual(quests.map(q=>q.id));
  });
  it('does not fabricate quests for an empty graph', () => {
    const dataset=demoDataset(); dataset.foods=[];dataset.meta.count=0;dataset.meta.rawCount=0;
    expect(createDailyQuests(dataset,analyze([]),'2026-10-21')).toHaveLength(3);
    expect(createDailyQuests(dataset,analyze([]),'2026-10-21').every(q=>!q.available)).toBe(true);
  });
  it('compares only the first two slots and never substitutes missing values', () => {
    const foods = structuredClone(demoDataset().foods.slice(0, 3));
    foods[0].nutrition.fatG = 9; foods[1].nutrition.fatG = 2; foods[2].nutrition.fatG = 100;
    expect(compareNutrition(foods).find(row => row.key === 'fatG')).toMatchObject({ values: [9, 2, 100], delta: -7 });
    expect(compareNutrition([]).every(row => row.delta === null && !row.comparable)).toBe(true);
    expect(compareNutrition(foods.slice(0, 1)).every(row => row.delta === null)).toBe(true);
    foods[1].nutrition.fatG = Number.NaN;
    expect(compareNutrition(foods).find(row => row.key === 'fatG')).toMatchObject({ values: [9, null, 100], delta: null });
  });
  it('isolates daily IDs by data content, mode and local calendar date', () => {
    const dataset = demoDataset();
    const version = datasetVersion(dataset);
    expect(localDateKey(new Date(2026, 9, 21, 0, 1))).toBe('2026-10-21');
    dataset.foods.reverse();
    expect(datasetVersion(dataset)).toBe(version);
    dataset.foods[0].nutrition.kcal = 123;
    expect(datasetVersion(dataset)).not.toBe(version);
    const demoIds = createDailyQuests(dataset, analyze(dataset.foods), '2026-10-21').map(quest => quest.id);
    dataset.meta.mode = 'official-snapshot';
    const officialIds = createDailyQuests(dataset, analyze(dataset.foods), '2026-10-21').map(quest => quest.id);
    expect(officialIds.every(id => !demoIds.includes(id))).toBe(true);
  });
  it('provides strict, deterministic top-three nutrient answers including ties', () => {
    const dataset = demoDataset();
    dataset.foods = dataset.foods.slice(0, 4);
    for (const food of dataset.foods) {
      food.nutrition = { kcal: 10, proteinG: 10, fatG: 10, carbsG: 10, sodiumMg: 10, calciumMg: null };
    }
    const graph = analyze(dataset.foods);
    const quest = createDailyQuests(dataset, graph, '2026-10-21').find(item => item.type === 'nutrient')!;
    expect(quest.candidates).toEqual(['demo-0', 'demo-1', 'demo-2']);
    expect(validateQuest(quest, ['demo-0'], graph)).toBe(true);
    expect(validateQuest(quest, ['demo-3'], graph)).toBe(false);
    expect(validateQuest(quest, ['demo-0', 'demo-0'], graph)).toBe(false);
    expect(validateQuest({ ...quest, candidates: ['demo-3'] }, ['demo-3'], graph)).toBe(false);
  });
  it('requires actual cross-category twins and exact planned route endpoints', () => {
    const dataset = demoDataset();
    dataset.foods = dataset.foods.slice(0, 4);
    for (const food of dataset.foods) food.nutrition = { kcal: 1, proteinG: 1, fatG: 1, carbsG: 1, sodiumMg: 1, calciumMg: null };
    dataset.foods[3].category = 'drink';
    const graph = analyze(dataset.foods);
    const quests = createDailyQuests(dataset, graph, '2026-10-21');
    const twins = quests.find(item => item.type === 'twins')!;
    expect(twins.available).toBe(true);
    expect(validateQuest(twins, twins.pair!, graph)).toBe(true);
    expect(validateQuest(twins, ['demo-0', 'demo-1'], graph)).toBe(false);
    expect(validateQuest(twins, ['demo-0', 'demo-0'], graph)).toBe(false);
    const route = quests.find(item => item.type === 'route')!;
    expect(validateQuest(route, route.pair!, graph)).toBe(false);
    expect(validateQuest(route, [...route.pair!].reverse(), graph, 'route-planned')).toBe(true);
    const other = dataset.foods.find(food => !route.pair!.includes(food.id))!.id;
    expect(validateQuest(route, [route.pair![0], other], graph, 'route-planned')).toBe(false);
    expect(validateQuest(route, route.pair!, { ...graph, edges: [] }, 'route-planned')).toBe(false);
  });
  it('keeps sparse and missing data tasks unavailable', () => {
    const dataset = demoDataset();
    dataset.foods = dataset.foods.slice(0, 1);
    expect(createDailyQuests(dataset, analyze(dataset.foods), '2026-10-21').every(quest => !quest.available)).toBe(true);
    dataset.foods = demoDataset().foods.slice(0, 4);
    for (const food of dataset.foods) food.nutrition = { kcal: null, proteinG: null, fatG: null, carbsG: null, sodiumMg: null, calciumMg: null };
    expect(createDailyQuests(dataset, analyze(dataset.foods), '2026-10-21').every(quest => !quest.available)).toBe(true);
  });
  it('rejects hostile storage shapes and bounds long histories', () => {
    for (const raw of ['null', '[]', 'true', '{"version":"1"}', ' '.repeat(128 * 1024 + 1)]) {
      expect(readPersistentState(raw, ['a']).favoriteIds).toEqual([]);
    }
    const ids = Array.from({ length: 12 }, (_, index) => `food-${index}`);
    const progress = Object.fromEntries(Array.from({ length: 200 }, (_, index) => [`quest-${index}`, 'completed']));
    const state = readPersistentState(JSON.stringify({ version: 1, favoriteIds: [null, ...ids, ...ids], labSelectedIds: [...ids, ...ids], recentlyViewed: [...ids, ...ids], questProgress: { ...progress, constructor: 'claimed', prototype: 'claimed', invalid: false }, sound: 'true' }), ids);
    expect(state.favoriteIds).toEqual(ids);
    expect(state.labSelectedIds).toEqual(ids.slice(0, 3));
    expect(state.recentlyViewed).toEqual(ids.slice(0, 6));
    expect(Object.keys(state.questProgress)).toHaveLength(180);
    expect(Object.hasOwn(state.questProgress, 'constructor')).toBe(false);
    expect(Object.hasOwn(state.questProgress, 'prototype')).toBe(false);
    expect(state.sound).toBe(false);
    const hostile = readPersistentState('{"version":1,"questProgress":{"__proto__":"claimed","safe":"started"}}', ids);
    expect(Object.hasOwn(hostile.questProgress, '__proto__')).toBe(false);
    expect(hostile.questProgress.safe).toBe('started');
  });
});
