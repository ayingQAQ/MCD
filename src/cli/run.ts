import type { Dataset } from '../data/schema';
export interface CliResult { ok: boolean; mode: Dataset['meta']['mode']; data?: unknown; error?: { code: string; message: string; candidates?: { id: string; name: string }[] } }
export function runCli(_args: string[], dataset: Dataset): CliResult { void _args; return { ok: false, mode: dataset.meta.mode, error: { code: 'NOT_IMPLEMENTED', message: 'CLI not implemented' } }; }
