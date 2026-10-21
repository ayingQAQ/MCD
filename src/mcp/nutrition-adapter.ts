import { decode } from '@toon-format/toon';
import { z } from 'zod';
import { datasetSchema, stableHash, type Dataset, type FoodPlanet } from '../data/schema';
import { inferCategory } from '../data/categories';

const fields = ['productName', 'nutritionDescription', 'energyKj', 'energyKcal', 'protein', 'fat', 'carbohydrate', 'sodium', 'calcium'];
const envelope = z.object({ success: z.literal(true), code: z.literal(200), data: z.string() });
const resultSchema = z.object({ isError: z.boolean().optional(), structuredContent: z.unknown().optional(), content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional() });

export function parseNutritionResponse(input: unknown, fetchedAt = new Date().toISOString()): Dataset {
  const result = resultSchema.parse(input);
  if (result.isError) throw new Error('营养工具返回错误，旧快照保持不变');
  let original = result.structuredContent;
  if (original === undefined) {
    const text = result.content?.find(c => c.type === 'text' && c.text?.includes('## Original Response'))?.text;
    if (!text) throw new Error('未识别的 MCP 响应格式');
    const body = text.slice(text.indexOf('## Original Response') + '## Original Response'.length).trim();
    original = JSON.parse(body.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, ''));
  }
  const { data } = envelope.parse(original);
  const tableHeader = data.trimStart().split('\n')[0].match(/^\[(\d+)\]\{([^}]+)\}:\s*$/);
  if (!tableHeader || tableHeader[2].split(',').join(',') !== fields.join(',')) throw new Error('营养表格字段发生变化，需要更新适配器');
  const decoded: unknown = decode(data, { strict: true });
  const rows = z.array(z.record(z.string(), z.unknown())).parse(decoded);
  if (rows.length !== Number(tableHeader[1])) throw new Error('餐品行数不一致');
  const warnings: string[] = [];
  const unique = new Map<string, { row: Record<string, unknown>; duplicates: number }>();
  for (const row of rows) {
    const key = JSON.stringify(fields.map(f => row[f]));
    const existing = unique.get(key);
    if (existing) existing.duplicates++;
    else unique.set(key, { row, duplicates: 1 });
  }
  const names = new Map<string, number>();
  const nameOf = (row: Record<string, unknown>) => z.string().min(1).parse(row.productName).normalize('NFC').trim();
  for (const { row } of unique.values()) {
    const name = nameOf(row);
    if (!name) throw new Error('餐品名称为空');
    names.set(name, (names.get(name) ?? 0) + 1);
  }
  const foods: FoodPlanet[] = [];
  for (const [canonical, { row, duplicates }] of unique) {
    const name = nameOf(row);
    const value = (field: string): number | null => {
      const raw = row[field];
      if (raw === null || raw === undefined) return null;
      const numeric = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\d+(?:\.\d+)?$/.test(raw) ? Number(raw) : NaN;
      if (!Number.isFinite(numeric) || numeric < 0) { warnings.push(`${name}：${field} 无效，保留为空值`); return null; }
      return numeric;
    };
    const category = inferCategory(name);
    const id = `food-${stableHash(name).toString(36)}${(names.get(name) ?? 0) > 1 ? `-${stableHash(canonical).toString(36)}` : ''}`;
    foods.push({ id, name, category, categorySource: category === 'other' ? 'unknown' : 'inferred',
      nutrition: { kcal: value('energyKcal'), proteinG: value('protein'), fatG: value('fat'), carbsG: value('carbohydrate'), sodiumMg: value('sodium'), calciumMg: value('calcium') },
      basis: { status: 'unverified', description: '接口所列餐品规格；计量基准未声明', unitsVerified: false },
      provenance: { provider: 'mcd-mcp', tool: 'list-nutrition-foods', fetchedAt, originalName: String(row.productName), duplicateCount: duplicates },
    });
  }
  if (rows.length !== foods.length) warnings.push(`已合并 ${rows.length - foods.length} 条完全重复记录`);
  if ([...names.values()].some(n => n > 1)) warnings.push('同名但数据不同的记录分别保留，请按 ID 选择');
  warnings.push('除 energyKcal/energyKj 外，接口未显式声明营养字段单位；未确认每份或每 100 克基准');
  return datasetSchema.parse({ meta: { mode: 'official-snapshot', source: 'https://mcp.mcd.cn · list-nutrition-foods', fetchedAt, schemaVersion: '1.0', algorithmVersion: '1.0', rawCount: rows.length, count: foods.length }, foods: foods.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0), warnings });
}
