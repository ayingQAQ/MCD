import { nutrientKeys, nutrientNames, type FoodPlanet, type NutrientKey } from '../data/schema';
export interface ComparisonRow { key: NutrientKey; label: string; values: (number | null)[]; unit: string; delta: number | null; comparable: boolean }
export function compareNutrition(foods: readonly FoodPlanet[]): ComparisonRow[] {
  return nutrientKeys.map(key => {
    const values = foods.map(food => {
      const value = food.nutrition[key];
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    });
    // kcal is explicit in the source field. Other units are only trustworthy
    // when the source actually verifies them; raw values remain raw values.
    const units = foods.map(food => key === 'kcal' ? 'kcal' : food.basis.unitsVerified ? key === 'sodiumMg' ? 'mg' : 'g' : '原始值');
    const comparable = foods.length >= 2 && values[0] !== null && values[1] !== null && units[0] === units[1];
    const unit = units.length && units.every(value => value === units[0]) ? units[0] : key === 'kcal' ? 'kcal' : '原始值';
    return { key, label: nutrientNames[key], values, unit, comparable, delta: comparable ? values[1]! - values[0]! : null };
  });
}
