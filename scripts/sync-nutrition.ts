import { config } from 'dotenv';
import { resolve } from 'node:path';
import { readNutrition, SyncError } from '../src/mcp/client.node.js';
import { saveSnapshot } from '../src/mcp/sync';

config({ path: '.env.local', quiet: true });
try {
  const token = process.env.MCD_MCP_TOKEN;
  if (!token) throw new SyncError('缺少 MCD_MCP_TOKEN；请设置环境变量或 .env.local。未修改快照。');
  const data = await saveSnapshot(await readNutrition(token), resolve('public/data/nutrition.snapshot.json'));
  console.log(JSON.stringify({ success: true, fetchedAt: data.meta.fetchedAt, rawCount: data.meta.rawCount, count: data.meta.count, warnings: data.warnings }));
} catch (error) {
  // Never log SDK errors, request objects, response envelopes or credentials.
  console.error(error instanceof SyncError ? error.message : '同步或校验失败，旧快照保持不变。请检查接口格式、网络及文件权限。');
  process.exitCode = 1;
}
