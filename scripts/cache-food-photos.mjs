import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Re-cache reviewed API image URLs. This never guesses product IDs or uses credentials.
const manifest = JSON.parse(await readFile('src/data/food-images.json', 'utf8'));
await mkdir('public/food-photos', { recursive: true });
for (const image of manifest.images) {
  const url = new URL(image.url);
  if (url.protocol !== 'https:' || url.hostname !== 'menu-img.mcd.cn' || !/^\/food-photos\/[a-z0-9_-]+\.(png|gif|jpe?g|webp)$/i.test(image.src)) throw new Error('Unapproved photo URL/path');
  const response = await fetch(url);
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Photo unavailable: ${image.code}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(resolve('public', `.${image.src}`), bytes);
}
console.log(`Cached ${manifest.images.length} reviewed menu photos`);
