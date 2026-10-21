import { parseArgs } from 'node:util';
import { categories, type Dataset } from '../data/schema';
import { analyze, discover, findRoute, neighbors } from '../graph/analysis';
export interface CliResult { ok: boolean; mode: Dataset['meta']['mode']; data?: unknown; error?: { code: string; message: string; candidates?: { id: string; name: string }[] } }
class CliError extends Error { constructor(public code: string, message: string, public candidates?: { id: string; name: string }[]) { super(message); } }
export function runCli(args: string[], dataset: Dataset): CliResult {
  try {
    const { values, positionals } = parseArgs({ args: args.filter(arg => arg !== '--'), allowPositionals: true, options: {
      category: { type: 'string' }, name: { type: 'string' }, id: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' }, 'from-id': { type: 'string' }, 'to-id': { type: 'string' }, limit: { type: 'string' }, kind: { type: 'string' }, demo: { type: 'boolean' },
    } });
    if (positionals.length !== 1) throw new CliError('USAGE', '请指定一个命令：list / neighbors / route / discover');
    const limit = values.limit === undefined ? 3 : Number(values.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new CliError('INVALID_ARGUMENT', 'limit 必须为 1–20 的整数');
    const resolve = (id?: string, name?: string) => {
      if (!id && !name) throw new CliError('INVALID_ARGUMENT', '请提供餐品名称或稳定 ID');
      const matches = dataset.foods.filter(food => id ? food.id === id : food.name === name?.normalize('NFC').trim());
      if (!matches.length) throw new CliError('NOT_FOUND', '没有找到该餐品');
      if (matches.length > 1) throw new CliError('AMBIGUOUS', '有多个同名餐品，请使用 ID 选择', matches.map(({ id, name }) => ({ id, name })));
      return matches[0].id;
    };
    let data: unknown;
    switch (positionals[0]) {
      case 'list': {
        if (values.category && !categories.some(cat => cat === values.category)) throw new CliError('INVALID_ARGUMENT', '未知类别，请使用 burger / breakfast / side / drink / dessert / other');
        data = dataset.foods.filter(food => !values.category || food.category === values.category); break;
      }
      case 'neighbors': { const id = resolve(values.id, values.name); data = neighbors(analyze(dataset.foods), id, limit); break; }
      case 'route': {
        const from = resolve(values['from-id'], values.from), to = resolve(values['to-id'], values.to);
        const route = findRoute(analyze(dataset.foods), from, to);
        if (!route) throw new CliError('NO_ROUTE', '暂时没有可达的营养航线');
        data = route; break;
      }
      case 'discover': {
        if (values.kind !== 'twins' && values.kind !== 'lonely') throw new CliError('INVALID_ARGUMENT', 'kind 必须是 twins 或 lonely');
        data = discover(dataset.foods)[values.kind]; break;
      }
      default: throw new CliError('USAGE', '未知命令，请使用 list / neighbors / route / discover');
    }
    return { ok: true, mode: dataset.meta.mode, data };
  } catch (error) {
    return { ok: false, mode: dataset.meta.mode, error: error instanceof CliError ? { code: error.code, message: error.message, ...(error.candidates ? { candidates: error.candidates } : {}) } : { code: 'INVALID_ARGUMENT', message: '命令参数无法解析，请查看 README 示例' } };
  }
}
