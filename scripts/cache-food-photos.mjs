import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Re-cache reviewed API image URLs. This never guesses product IDs or uses credentials.
const manifest = JSON.parse(await readFile('src/data/food-images.json', 'utf8'));
await mkdir('public/food-photos', { recursive: true });
const cachedPaths = new Map();
for (const image of manifest.images) {
  const url = new URL(image.url);
  const officialSource = image.sourceTool === 'official-product-page' && image.sourcePage?.startsWith('https://www.mcdonalds.com.cn/product/')
    || image.sourceTool === 'official-nutrition-page' && image.sourcePage === 'https://www.mcdonalds.com.cn/nutrition_calculator'
    || image.sourceTool === 'official-promotion-page' && image.sourcePage?.startsWith('https://www.mcdonalds.com.cn/news/');
  const official = url.hostname === 'officiaweb-afd.mcdonalds.com.cn' && officialSource;
  if (url.protocol !== 'https:' || !(url.hostname === 'menu-img.mcd.cn' || official) || !/^\/food-photos\/[a-z0-9_-]+\.(png|gif|jpe?g|webp)$/i.test(image.src)) throw new Error('Unapproved photo URL/path');
  if (cachedPaths.has(image.src)) {
    if (cachedPaths.get(image.src) !== image.url) throw new Error(`Conflicting image source: ${image.code}`);
    continue;
  }
  const response = await fetch(url, official ? { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.mcdonalds.com.cn/' } } : undefined);
  if (!response.ok) throw new Error(`Photo unavailable: ${image.code}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const magic = Array.from(bytes.slice(0, 12));
  const validImage = magic[0] === 137 && magic[1] === 80 && magic[2] === 78 && magic[3] === 71
    || magic[0] === 255 && magic[1] === 216
    || magic[0] === 71 && magic[1] === 73 && magic[2] === 70
    || magic[0] === 82 && magic[1] === 73 && magic[2] === 70 && magic[3] === 70 && magic[8] === 87 && magic[9] === 69 && magic[10] === 66 && magic[11] === 80;
  if (!validImage) throw new Error(`Invalid photo bytes: ${image.code}`);
  await writeFile(resolve('public', `.${image.src}`), bytes);
  cachedPaths.set(image.src, image.url);
}
console.log(`Cached ${cachedPaths.size} unique images for ${manifest.images.length} reviewed food matches`);
