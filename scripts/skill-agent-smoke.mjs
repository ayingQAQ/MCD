import { cp, mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Remote executor for a real Agent-chosen invocation. No shell interpolation.
let temporary;
try {
  const args = JSON.parse(process.env.MCCOSMOS_SKILL_ARGS || '[]');
  if (!Array.isArray(args) || args.length < 1 || args.length > 24 || args.some(arg => typeof arg !== 'string' || arg.length > 1000 || arg.includes('\0'))
    || !['search', 'compare', 'alternatives', 'list', 'neighbors', 'route', 'discover'].includes(args[0])
    || args.some(arg => /^--(?:data|response|fetched-at)(?:=|$)/.test(arg))) throw new Error('Invalid request');
  temporary = await mkdtemp(join(tmpdir(), 'mccosmos-agent-'));
  const installed = join(temporary, 'mccosmos');
  await cp('dist-skill/mccosmos', installed, { recursive: true });
  const child = spawnSync(process.execPath, [join(installed, 'scripts', 'mccosmos.mjs'), ...args], { cwd: temporary, encoding: 'utf8', timeout: 15_000 });
  if (child.error || child.status === null) throw new Error('Execution failed');
  const result = JSON.parse(child.stdout);
  await mkdir('artifacts/skill-agent', { recursive: true });
  await writeFile('artifacts/skill-agent/invocation.json', JSON.stringify({ kind: 'agent-selected-remote-invocation', args, exitCode: child.status, result }, null, 2) + '\n');
  console.log(JSON.stringify(result));
  process.exitCode = child.status;
} catch {
  console.error('Agent invocation failed validation or execution; no fallback data was used.');
  process.exitCode = 1;
} finally {
  if (temporary) await rm(temporary, { recursive: true, force: true });
}
