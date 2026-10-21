import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export class SyncError extends Error {
  constructor(message: string, public status?: number) { super(message); }
}
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export async function retryFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(30_000)]) : AbortSignal.timeout(30_000) });
      if (response.status === 401) throw new SyncError('401：Token 无效或已过期，请重新配置', 401);
      if ((response.status === 429 || response.status >= 500) && attempt < 2) {
        const header = response.headers.get('retry-after');
        const retry = header ? (/^\d+$/.test(header) ? Number(header) * 1000 : Date.parse(header) - Date.now()) : 1000 * 2 ** attempt;
        await response.body?.cancel();
        await pause(Math.max(0, Math.min(30_000, Number.isFinite(retry) ? retry : 1000)));
        continue;
      }
      if (!response.ok) throw new SyncError(`同步请求失败（HTTP ${response.status}），旧快照保持不变`, response.status);
      return response;
    } catch (error) {
      if (error instanceof SyncError) throw error;
      if (attempt === 2 || init?.signal?.aborted) throw new SyncError('网络或超时错误，请检查连接后重试；旧快照保持不变');
      await pause(1000 * 2 ** attempt);
    }
  }
  throw new SyncError('同步重试次数已用尽');
}
export async function readNutrition(token: string): Promise<unknown> {
  if (!token.trim() || /\s/.test(token)) throw new SyncError('请设置不含 Bearer 前缀的 MCD_MCP_TOKEN');
  const client = new Client({ name: 'mccosmos', version: '0.1.0' });
  const transport = new StreamableHTTPClientTransport(new URL('https://mcp.mcd.cn'), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } }, fetch: retryFetch,
  });
  try {
    await client.connect(transport, { timeout: 30_000 });
    let cursor: string | undefined;
    let found = false;
    for (let page = 0; page < 10; page++) {
      const tools = await client.listTools(cursor ? { cursor } : {}, { timeout: 30_000 });
      if (tools.tools.some(tool => tool.name === 'list-nutrition-foods')) { found = true; break; }
      cursor = tools.nextCursor;
      if (!cursor) break;
    }
    if (!found) throw new SyncError('当前账号未提供 list-nutrition-foods 工具');
    return await client.callTool({ name: 'list-nutrition-foods', arguments: {} }, undefined, { timeout: 120_000, maxTotalTimeout: 120_000 });
  } finally { await client.close().catch(() => undefined); }
}
