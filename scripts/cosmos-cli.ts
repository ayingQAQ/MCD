import { runCliProcess } from '../src/cli/entry.node.js';

await runCliProcess(new URL('../public/data/nutrition.snapshot.json', import.meta.url));
