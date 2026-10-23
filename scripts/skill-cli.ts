import { runCliProcess } from '../src/cli/entry.node';

// After bundling, this module lives in <installed-skill>/scripts/mccosmos.mjs.
await runCliProcess(new URL('../assets/nutrition.snapshot.json', import.meta.url));
