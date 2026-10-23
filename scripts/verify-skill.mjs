import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const source = resolve('dist-skill/mccosmos');
const scratch = await mkdtemp(join(tmpdir(), 'mccosmos-standalone-'));
const evidence = [];
try {
  const installed = join(scratch, 'skills', 'mccosmos'), working = join(scratch, 'unrelated-directory');
  await cp(source, installed, { recursive: true }); await mkdir(working);
  const entry = join(installed, 'scripts', 'mccosmos.mjs');
  const snapshot = JSON.parse(await readFile(join(installed, 'assets', 'nutrition.snapshot.json'), 'utf8'));
  const skill = await readFile(join(installed, 'SKILL.md'), 'utf8');
  assert.match(skill, /^---\r?\nname: mccosmos\r?\ndescription: .+\r?\n---/);
  await readFile(join(installed, 'references', 'commands.md'));
  await readFile(join(installed, 'agents', 'openai.yaml'));
  for (const path of await readdir(installed, { recursive: true })) assert(!/(^|[/\\])(?:node_modules|\.env(?:\.|$)|\.git)(?:[/\\]|$)/.test(path), 'Unexpected dependency/secret directory in Skill');
  function run(request, args, success = true) {
    const processResult = spawnSync(process.execPath, [entry, ...args], { cwd: working, encoding: 'utf8', timeout: 15_000 });
    assert.equal(processResult.error, undefined);
    assert.equal(processResult.status, success ? 0 : 1, processResult.stderr || processResult.stdout);
    const result = JSON.parse(processResult.stdout);
    assert.equal(result.ok, success);
    evidence.push({ request, args, exitCode: processResult.status, result });
    return result;
  }
  const comparison = run('对比巨无霸和麦香鱼的营养差异', ['compare', '--from=巨无霸', '--to=麦香鱼']);
  assert.deepEqual(comparison.data.foods.map(food => food.name), ['巨无霸', '麦香鱼']);
  assert.equal(comparison.dataInput, 'bundled-snapshot');
  assert.equal(comparison.fetchedAt, snapshot.meta.fetchedAt);
  assert.equal(comparison.data.rows[0].delta, comparison.data.foods[1].nutrition.kcal - comparison.data.foods[0].nutrition.kcal);
  assert.equal(comparison.data.rows.find(row => row.key === 'proteinG').unit, '原始值');
  const alternatives = run('找比巨无霸热量低、营养特征相近的同类替代品', ['alternatives', '--name=巨无霸', '--lower-kcal']);
  assert(alternatives.data.candidates.length > 0);
  for (const item of alternatives.data.candidates) {
    assert(item.food.nutrition.kcal < alternatives.data.reference.nutrition.kcal);
    assert.equal(item.food.category, alternatives.data.reference.category);
    assert(item.similarity.score >= 50);
    assert(item.links.atlas.includes(encodeURIComponent(item.food.id)));
  }
  const breakfast = run('早餐里不超过400 kcal的有哪些，按热量升序', ['search', '--category=breakfast', '--max-kcal=400', '--sort=kcal-asc', '--limit=20']);
  assert(breakfast.data.foods.length > 0);
  breakfast.data.foods.forEach((food, index, foods) => {
    assert.equal(food.category, 'breakfast'); assert(food.nutrition.kcal !== null && food.nutrition.kcal <= 400);
    if (index) assert(foods[index - 1].nutrition.kcal <= food.nutrition.kcal);
  });
  const cups = run('冰牛奶有哪些具体杯型', ['search', '--query=冰牛奶', '--limit=10']);
  assert.deepEqual(cups.data.foods.map(food => food.name).sort(), ['冰牛奶小杯', '冰牛奶中杯', '冰牛奶大杯'].sort());
  assert.equal(run('没有匹配时不要编造', ['search', '--query=does-not-exist-test']).data.total, 0);
  assert.equal(run('数据文件坏了不能回退', ['search', '--data', join(working, 'missing.json')], false).error.code, 'DATA_UNAVAILABLE');
  assert.equal(run('不能默默忽略对比命令上的筛选参数', ['compare', '--from=巨无霸', '--to=麦香鱼', '--max-kcal=300'], false).error.code, 'INVALID_ARGUMENT');
  const names = snapshot.foods.map(food => food.name);
  assert(names.includes('巨无霸') && names.includes('麦香鱼'));
  console.log(`Standalone Skill verification passed: ${evidence.length} request/command cases, copied package outside repository, no dependency installation.`);
} finally {
  await mkdir('artifacts/skill', { recursive: true });
  await writeFile('artifacts/skill/acceptance.json', JSON.stringify({ kind: 'deterministic-command-acceptance', note: '这些是自然语言验收场景到CLI的固定映射，不等于自动发现Skill或LLM自然语言路由评测。', cases: evidence }, null, 2) + '\n');
  await rm(scratch, { recursive: true, force: true });
}
