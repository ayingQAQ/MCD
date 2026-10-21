import { mkdir, writeFile } from 'node:fs/promises';
import { foodPresets } from '../src/components/food-illustrations/presets/foods';
import { renderFoodIllustrationSvg } from '../src/components/food-illustrations/exportSvg';

// Static original SVGs, served locally and reused by world-space WebGL sprites.
const directory = 'public/food-planets';
await mkdir(directory, { recursive: true });
for (const preset of foodPresets) {
  await writeFile(`${directory}/${preset.id}.svg`, await renderFoodIllustrationSvg({ foodId: preset.id, size: 256, cosmic: false, decorative: true }));
}
console.log(`Prepared ${foodPresets.length} original food planet textures`);
