import { describe, expect, it, vi } from 'vitest';
import { createImageCache } from '../src/galaxy/imageCache';

const image = (size = 16) => ({ naturalWidth: size, naturalHeight: size }) as HTMLImageElement;
describe('bounded decoded illustration cache', () => {
  it('deduplicates concurrent loads and keeps the same decoded source for the next scene', async () => {
    const load = vi.fn(async () => image()), cache = createImageCache(load);
    const first = cache.get('burger'), second = cache.get('burger');
    expect(first).toBe(second);
    expect(await first).toBe(await cache.get('burger'));
    expect(load).toHaveBeenCalledTimes(1);
    expect(cache.stats()).toEqual({ entries: 1, bytes: 1024, pending: 0 });
  });
  it('evicts the least recently used image at the entry limit', async () => {
    const load = vi.fn(async () => image()), cache = createImageCache(load, 2);
    await cache.get('a'); await cache.get('b'); await cache.get('a'); await cache.get('c');
    await cache.get('a'); expect(load).toHaveBeenCalledTimes(3);
    await cache.get('b'); expect(load).toHaveBeenCalledTimes(4);
    expect(cache.stats().entries).toBe(2);
  });
  it('bounds decoded pixel bytes and does not retain an oversized image', async () => {
    const load = vi.fn(async (url: string) => image(url === 'large' ? 64 : 16));
    const cache = createImageCache(load, 10, 2048);
    await cache.get('a'); await cache.get('b'); await cache.get('c');
    expect(cache.stats()).toEqual({ entries: 2, bytes: 2048, pending: 0 });
    await cache.get('large'); await cache.get('large');
    expect(cache.stats().bytes).toBe(2048);
    expect(load).toHaveBeenCalledTimes(5);
  });
  it('does not cache failures, allowing a real retry', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(image());
    const cache = createImageCache(load);
    await expect(cache.get('a')).rejects.toThrow('offline');
    expect(cache.stats()).toEqual({ entries: 0, bytes: 0, pending: 0 });
    await expect(cache.get('a')).resolves.toHaveProperty('naturalWidth', 16);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
