import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveSnapshot } from '../src/mcp/sync';
import { retryFetch, SyncError } from '../src/mcp/client.node.js';

afterEach(() => vi.restoreAllMocks());
describe('protected sync', () => {
  it('retains an existing snapshot on malformed tool output', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'mccosmos-'));
    const path = join(directory, 'snapshot.json');
    try { await writeFile(path, 'previous'); await expect(saveSnapshot({}, path)).rejects.toThrow(); expect(await readFile(path, 'utf8')).toBe('previous'); }
    finally { await rm(directory, { recursive: true, force: true }); }
  });
  it('does not retry unauthorized requests or expose request credentials', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 401 }));
    await expect(retryFetch('https://mcp.mcd.cn', { headers: { Authorization: 'Bearer synthetic-test-only' } })).rejects.toBeInstanceOf(SyncError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('retries rate limiting with bounded retry-after and returns the successful response', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 429, headers: { 'retry-after': '0' } })).mockResolvedValueOnce(new Response('{}', { status: 200 }));
    expect((await retryFetch('https://mcp.mcd.cn')).status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
