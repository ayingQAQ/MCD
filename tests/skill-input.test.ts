import { afterEach, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { executeWithData } from '../src/cli/entry.node';
import { demoDataset } from '../src/data/demo';

const snapshot = new URL('../public/data/nutrition.snapshot.json', import.meta.url);
const temporary: string[] = [];
afterEach(async () => { await Promise.all(temporary.map(path => rm(path, { recursive: true, force: true }))); temporary.length = 0; });
async function file(body: unknown) { const directory = await mkdtemp(join(tmpdir(), 'mccosmos-input-')); temporary.push(directory); const path = join(directory, 'input.json'); await writeFile(path, JSON.stringify(body)); return path; }

it('keeps supplied snapshot mode explicit and never falls back after an invalid input', async () => {
  const path = await file(demoDataset());
  expect(await executeWithData(['search', '--data', path], snapshot)).toMatchObject({ ok: false });
  expect(await executeWithData(['search', '--data', path, '--demo'], snapshot)).toMatchObject({ ok: true, mode: 'synthetic-demo', dataInput: 'provided-snapshot' });
  const invalid = await file({ secret: 'do-not-echo-this' });
  const failed = await executeWithData(['search', '--data', invalid], snapshot);
  expect(failed).toMatchObject({ ok: false, error: { code: 'DATA_UNAVAILABLE' } });
  expect(JSON.stringify(failed)).not.toContain('do-not-echo-this');
});

it('requires a captured response time and preserves zero and the declared acquisition time', async () => {
  const path = await file({ structuredContent: { success: true, code: 200, data: '[1]{productName,nutritionDescription,energyKj,energyKcal,protein,fat,carbohydrate,sodium,calcium}:\n  接口夹具,测试,0,0,0,0,0,0,0' } });
  expect(await executeWithData(['search', '--response', path], snapshot)).toMatchObject({ ok: false, error: { code: 'INVALID_ARGUMENT' } });
  const result = await executeWithData(['search', '--response', path, '--fetched-at=2026-10-01T00:00:00Z', '--max-kcal=0'], snapshot);
  expect(result).toMatchObject({ ok: true, mode: 'official-snapshot', fetchedAt: '2026-10-01T00:00:00Z', dataInput: 'provided-mcp-response', data: { total: 1, foods: [{ nutrition: { kcal: 0 } }] } });
});

it('rejects conflicting, duplicate, missing and orphan source options', async () => {
  for (const args of [['--data'], ['--data='], ['--response=x', '--data=y'], ['--response=x', '--demo'], ['--fetched-at=2026-10-01T00:00:00Z'], ['--data=x', '--data=y'], ['--response=x', '--fetched-at=invalid']]) {
    expect(await executeWithData(['search', ...args], snapshot)).toMatchObject({ ok: false, error: { code: 'INVALID_ARGUMENT' } });
  }
});
