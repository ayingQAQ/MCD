import { describe, it, expect } from 'vitest';
import { demoDataset } from '../src/data/demo';
import { analyze, findRoute } from '../src/graph/analysis';
import { compareNutrition } from '../src/core/comparison';
import { createDailyQuests, validateQuest } from '../src/core/quests';
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
});
