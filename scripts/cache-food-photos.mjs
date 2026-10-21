import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Re-cache reviewed API image URLs. This never guesses product IDs or uses credentials.
const manifest = JSON.parse(await readFile('src/data/food-images.json', 'utf8'));
await mkdir('public/food-photos', { recursive: true });
const cachedPaths = new Map();
for (const image of manifest.images) {
  const url = new URL(image.url);
  const official = url.hostname === 'officiaweb-afd.mcdonalds.com.cn' && image.sourceTool === 'official-product-page' && image.sourcePage?.startsWith('https://www.mcdonalds.com.cn/product/');
  if (url.protocol !== 'https:' || !(url.hostname === 'menu-img.mcd.cn' || official) || !/^\/food-photos\/[a-z0-9_-]+\.(png|gif|jpe?g|webp)$/i.test(image.src)) throw new Error('Unapproved photo URL/path');
  if (cachedPaths.has(image.src)) {
    if (cachedPaths.get(image.src) !== image.url) throw new Error(`Conflicting image source: ${image.code}`);
    continue;
  }
  const response = await fetch(url, official ? { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.mcdonalds.com.cn/' } } : undefined);
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Photo unavailable: ${image.code}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(resolve('public', `.${image.src}`), bytes);
  cachedPaths.set(image.src, image.url);
}
console.log(`Cached ${cachedPaths.size} unique images for ${manifest.images.length} reviewed food matches`);
