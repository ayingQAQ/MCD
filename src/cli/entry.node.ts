import { readFile } from 'node:fs/promises';
import { datasetSchema } from '../data/schema';
import { demoDataset } from '../data/demo';
import { parseNutritionResponse } from '../mcp/nutrition-adapter';
import { runCli } from './run';

class InputError extends Error { }

/** Source selection is separate from analysis, and never falls back after a read error. */
export async function executeWithData(args: string[], defaultSnapshot: URL) {
  try {
    const source: Record<string, string> = {}, command: string[] = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const key = ['data', 'response', 'fetched-at'].find(key => arg === `--${key}` || arg.startsWith(`--${key}=`));
      if (!key) { command.push(arg); continue; }
      const value = arg.startsWith(`--${key}=`) ? arg.slice(key.length + 3) : args[++i];
      if (!value?.trim() || value.startsWith('--') || source[key] !== undefined) throw new InputError('数据参数为空、重复或缺少路径');
      source[key] = value;
    }
    const demo = command.includes('--demo');
    if (source.data && source.response || source.response && demo || source['fetched-at'] && !source.response) throw new InputError('数据来源选项冲突；响应时间只与 --response 一起使用');
    if (source.response && (!source['fetched-at'] || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(source['fetched-at']) || !Number.isFinite(Date.parse(source['fetched-at'])))) throw new InputError('MCP 响应需要 --fetched-at 提供明确的 ISO 获取时间');
    const data = source.response
      ? parseNutritionResponse(JSON.parse(await readFile(source.response, 'utf8')), source['fetched-at'])
      : source.data ? datasetSchema.parse(JSON.parse(await readFile(source.data, 'utf8')))
        : demo ? demoDataset() : datasetSchema.parse(JSON.parse(await readFile(defaultSnapshot, 'utf8')));
    if (data.meta.mode !== (demo ? 'synthetic-demo' : 'official-snapshot') || data.foods.length === 0) throw new InputError('数据来源模式不符或餐品为空；演示数据必须显式使用 --demo');
    const fetched = data.meta.fetchedAt ? Date.parse(data.meta.fetchedAt) : NaN;
    return {
      ...runCli(command, data), source: data.meta.source, fetchedAt: data.meta.fetchedAt, warnings: data.warnings,
      dataInput: source.response ? 'provided-mcp-response' : source.data ? 'provided-snapshot' : demo ? 'synthetic-demo' : 'bundled-snapshot',
      snapshotAgeHours: Number.isFinite(fetched) ? Math.max(0, Math.floor((Date.now() - fetched) / 3_600_000)) : null,
      basisNote: '数据非门店实时供应信息；图鉴链接对应线上快照，可能不包含本次外部数据的新餐品。',
    };
  } catch (error) {
    return { ok: false, error: { code: error instanceof InputError ? 'INVALID_ARGUMENT' : 'DATA_UNAVAILABLE', message: error instanceof InputError ? error.message : '无法读取或校验指定数据；没有回退到另一份快照或演示数据。' } };
  }
}

export async function runCliProcess(defaultSnapshot: URL) {
  const result = await executeWithData(process.argv.slice(2), defaultSnapshot);
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
