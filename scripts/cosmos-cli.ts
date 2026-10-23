import { runCliProcess } from '../src/cli/entry.node';

await runCliProcess(new URL('../public/data/nutrition.snapshot.json', import.meta.url));
