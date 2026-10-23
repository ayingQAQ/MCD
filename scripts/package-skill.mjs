import { build } from 'vite';
import { cp, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const root = 'dist-skill/mccosmos';
await build({
  configFile: false,
  ssr: { target: 'node', noExternal: true },
  build: {
    ssr: 'scripts/skill-cli.ts', target: 'node24', outDir: `${root}/scripts`, emptyOutDir: true, minify: false,
    rolldownOptions: { output: { entryFileNames: 'mccosmos.mjs', inlineDynamicImports: true } },
  },
});
await cp('skills/mccosmos', root, { recursive: true });
await mkdir(`${root}/assets`, { recursive: true });
await mkdir(`${root}/licenses`, { recursive: true });
await copyFile('public/data/nutrition.snapshot.json', `${root}/assets/nutrition.snapshot.json`);
await copyFile('LICENSE', `${root}/licenses/PROJECT-LICENSE.txt`);
await copyFile('node_modules/zod/LICENSE', `${root}/licenses/zod.txt`);
await copyFile('node_modules/@toon-format/toon/LICENSE', `${root}/licenses/toon.txt`);
await copyFile('THIRD_PARTY_NOTICES.md', `${root}/licenses/THIRD_PARTY_NOTICES.md`);
const data = JSON.parse(await readFile('public/data/nutrition.snapshot.json', 'utf8'));
await writeFile(`${root}/assets/package-info.json`, JSON.stringify({ name: 'mccosmos', runtime: 'Node.js >=24', source: data.meta.source, fetchedAt: data.meta.fetchedAt, count: data.meta.count, dependenciesBundled: ['zod', '@toon-format/toon'] }, null, 2) + '\n');
console.log(`Packaged standalone Skill: ${root} (${data.meta.count} snapshot records; Node.js 24, no install required)`);
