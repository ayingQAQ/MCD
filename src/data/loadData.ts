import { datasetSchema, type Dataset } from './schema';
import { demoDataset } from './demo';

export async function loadDataset(demo = false, signal?: AbortSignal): Promise<Dataset> {
  if (demo) return demoDataset();
  const response = await fetch(`${import.meta.env.BASE_URL}data/nutrition.snapshot.json`, { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error('无法读取官方快照，请稍后重试，或主动选择合成演示。');
  const dataset = datasetSchema.parse(await response.json());
  if (dataset.meta.mode !== 'official-snapshot') throw new Error('官方快照位置包含了错误的数据来源');
  return dataset;
}
