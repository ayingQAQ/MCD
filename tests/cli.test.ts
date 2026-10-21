import { describe, expect, it } from 'vitest';
import { runCli } from '../src/cli/run';
import { demoDataset } from '../src/data/demo';
import { spawnSync } from 'node:child_process';
describe('CLI shared analysis', () => {
  it('lists explicit categories and includes honest mode metadata', () => {
    const result = runCli(['list', '--category=burger'], demoDataset());
    expect(result).toMatchObject({ ok: true, mode: 'synthetic-demo' });
    expect((result.data as { category: string }[]).every(f => f.category === 'burger')).toBe(true);
  });
  it('returns candidates for ambiguous names rather than selecting the first', () => {
    const data = demoDataset(); data.foods[1].name = data.foods[0].name;
    expect(runCli(['neighbors', `--name=${data.foods[0].name}`], data)).toMatchObject({ ok: false, error: { code: 'AMBIGUOUS', candidates: expect.any(Array) } });
  });
  it('accepts IDs, preserves same-node routes and reports missing records', () => {
    expect(runCli(['route', '--from-id=demo-0', '--to-id=demo-0'], demoDataset())).toMatchObject({ ok: true, data: ['demo-0'] });
    expect(runCli(['neighbors', '--id=missing'], demoDataset())).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
  });
  it('rejects unsupported commands, invalid limits and invalid categories', () => {
    for (const args of [['unknown'], ['neighbors', '--id=demo-0', '--limit=-1'], ['list', '--category=unknown']]) expect(runCli(args, demoDataset()).ok).toBe(false);
  });
  it('runs the actual Node CLI entrypoint with JSON-only stdout and correct exit codes', () => {
    const success = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/cosmos-cli.ts', 'list', '--category=burger'], { encoding: 'utf8' });
    expect(success.status).toBe(0);
    expect(JSON.parse(success.stdout)).toMatchObject({ ok: true, mode: 'official-snapshot' });
    const failure = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/cosmos-cli.ts', 'unknown'], { encoding: 'utf8' });
    expect(failure.status).toBe(1);
    expect(JSON.parse(failure.stdout)).toMatchObject({ ok: false, error: { code: 'USAGE' } });
  });
});
