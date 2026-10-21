import { mkdir, rename, writeFile, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseNutritionResponse } from './nutrition-adapter';
import type { Dataset } from '../data/schema';

export async function saveSnapshot(input: unknown, path: string): Promise<Dataset> {
  const data = parseNutritionResponse(input);
  if (!data.foods.length) throw new Error('营养接口返回空数据，拒绝覆盖旧快照');
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
  return data;
}
