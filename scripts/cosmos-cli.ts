import { readFile } from 'node:fs/promises';
import { datasetSchema } from '../src/data/schema';
import { demoDataset } from '../src/data/demo';
import { runCli } from '../src/cli/run';

const args = process.argv.slice(2);
try {
  const data = args.includes('--demo') ? demoDataset() : datasetSchema.parse(JSON.parse(await readFile(new URL('../public/data/nutrition.snapshot.json', import.meta.url), 'utf8')));
  if (!args.includes('--demo') && data.meta.mode !== 'official-snapshot') throw new Error('Invalid official snapshot');
  const result = { ...runCli(args, data), source: data.meta.source, fetchedAt: data.meta.fetchedAt, warnings: data.warnings };
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
} catch {
  console.log(JSON.stringify({ ok: false, error: { code: 'DATA_UNAVAILABLE', message: '无法读取官方快照；请先同步，或显式使用 --demo' } }));
  process.exitCode = 1;
}
