import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { foodPresets } from '../src/components/food-illustrations/presets/foods';
import { renderFoodIllustrationSvg } from '../src/components/food-illustrations/exportSvg';
const directory = 'artifacts/food-illustrations';
for (const mode of ['plain', 'cosmic']) {
  await mkdir(join(directory, mode), { recursive: true });
  for (const preset of foodPresets) await writeFile(join(directory, mode, `${preset.id}.svg`), await renderFoodIllustrationSvg({ foodId: preset.id, size: 160, cosmic: mode === 'cosmic' }));
}
await writeFile(join(directory, 'manifest.json'), JSON.stringify(foodPresets.map(({ id, name, family, variant, mapping }) => ({ id, name, family, variant, mapping })), null, 2));
await writeFile(join(directory, 'index.html'), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>McCosmos 独立SVG插画包</title><style>body{background:#fff9ed;color:#684536;font:14px sans-serif;padding:30px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:20px}article{padding:16px;border:1px solid #d5c2a8;border-radius:10px;background:#fffdf5}img{width:145px;height:145px}small{display:block;color:#947456}</style><h1>McCosmos · 原创餐品插画</h1><p>30个通用示例；左右分别为普通/宇宙模式，不代表真实商品配方。SVG可独立打开，无需React。</p><main>${foodPresets.map(p => `<article><img alt="${p.name}" src="plain/${p.id}.svg"><img alt="${p.name}宇宙模式" src="cosmic/${p.id}.svg"><p>${p.name}</p><small>${p.family} / ${p.id} / generic-example</small></article>`).join('')}</main></html>`);
console.log(`Exported ${foodPresets.length * 2} standalone SVGs to ${directory}`);
