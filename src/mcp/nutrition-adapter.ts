import type { Dataset } from '../data/schema';
export function parseNutritionResponse(_input: unknown, _fetchedAt = new Date().toISOString()): Dataset {
  void _input; void _fetchedAt;
  throw new Error('Nutrition adapter not implemented');
}
