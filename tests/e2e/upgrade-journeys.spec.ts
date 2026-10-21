import { readFile } from 'node:fs/promises';
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import snapshot from '../../public/data/nutrition.snapshot.json' with { type: 'json' };
import { datasetSchema, nutrientKeys } from '../../src/data/schema';
import { analyze } from '../../src/graph/analysis';
import { createDailyQuests } from '../../src/core/quests';

const dataset = datasetSchema.parse(snapshot);
const graph = analyze(dataset.foods);
const officialKey = 'mccosmos:explorer:v1:official-snapshot';
const headingNames = ['宇宙观测站', '营养星系', '星球图鉴', '营养实验室', '星际探索任务'];
const routes = ['/', '/galaxy', '/atlas', '/lab', '/quests'];

async function ready(page: Page, index: number) {
  await expect(page.getByRole('heading', { name: headingNames[index], exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByLabel('查看全局数据来源')).toBeVisible();
  if(index===1)await canvasScene(page.locator('canvas.galaxy-canvas'));
}
async function savePng(page: Page, button: Locator, info: TestInfo, name: string) {
  const downloaded = page.waitForEvent('download');
  await button.click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
  expect(await download.failure()).toBeNull();
  const path = info.outputPath(name);
  await download.saveAs(path);
  const data = await readFile(path);
  expect(data.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(data.readUInt32BE(16)).toBeGreaterThan(100);
  expect(data.readUInt32BE(20)).toBeGreaterThan(100);
  await info.attach(name, { path, contentType: 'image/png' });
}
async function addSample(page: Page, name: string) {
  await page.getByLabel('实验室搜索').fill(name);
  await page.getByRole('button', { name: `添加 ${name}`, exact: true }).click();
}
type SceneCamera = { position: [number, number, number]; target: [number, number, number]; distance: number };
type ProjectedPlanet = { id: string; x: number; y: number; radius: number; z: number; visible: boolean };
type ProjectedEdge = { source: string; target: string; points: { x: number; y: number; z: number }[] };
async function canvasScene(canvas: Locator) {
  await expect(canvas).toHaveAttribute('data-scene', 'webgl-3d');
  await expect(canvas).toHaveAttribute('data-camera', /distance/);
  return { camera: JSON.parse((await canvas.getAttribute('data-camera'))!) as SceneCamera, bounds: (await canvas.boundingBox())! };
}
async function visiblePlanet(canvas: Locator, ids: string[]) {
  const planets = JSON.parse((await canvas.getAttribute('data-planets'))!) as ProjectedPlanet[];
  const candidates = planets.filter(point => point.visible && ids.includes(point.id))
    .filter(point => planets.every(other => !other.visible || other.id === point.id || other.z > point.z || Math.hypot(other.x - point.x, other.y - point.y) > other.radius + 3))
    .sort((a, b) => a.z - b.z);
  return openCanvasPoint(canvas, candidates);
}
async function openCanvasPoint(canvas: Locator, candidates: { x: number; y: number; id?: string }[]) {
  return canvas.evaluate((element, points) => {
    const rect = element.getBoundingClientRect();
    return points.find(point => point.x > 12 && point.y > 12 && point.x < rect.width - 12 && point.y < rect.height - 12 && document.elementFromPoint(rect.left + point.x, rect.top + point.y) === element) ?? null;
  }, candidates);
}

test('random discovery opens an actual food; recent history, global keyboard search and deep links work', async ({ page }) => {
  await page.goto('/'); await ready(page, 0);
  await page.getByRole('button', { name: '随机发现一颗星球', exact: true }).click();
  await ready(page, 1);
  const id = new URL(page.url()).searchParams.get('focus');
  const food = dataset.foods.find(item => item.id === id);
  expect(food).toBeDefined();
  await expect(page.locator('.planet-details').getByRole('heading', { name: food!.name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: '关闭星球档案', exact: true }).click();
  await page.getByRole('link', { name: '宇宙观测站', exact: true }).click();
  await expect(page.locator('.recent-foods')).toContainText(food!.name);
  await page.locator('.recent-foods').getByRole('link').first().click();
  await ready(page, 2);
  await expect(page).toHaveURL(new RegExp(`food=${encodeURIComponent(food!.id)}`));
  await page.reload(); await ready(page, 2);
  await expect(page.locator('.planet-details').getByRole('heading', { name: food!.name, exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  const search = page.getByLabel('全局搜索餐品');
  await search.fill('巨无霸');
  await expect(page.locator('#global-food-results')).toContainText('巨无霸');
  await search.press('Escape');
  await expect(search).toHaveValue('');
  await expect(page.locator('#global-food-results')).toHaveCount(0);
  await search.fill('巨无霸'); await search.press('Enter');
  await expect(page.locator('.planet-details').getByRole('heading', { name: '巨无霸', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.locator('.planet-details').getByRole('heading', { name: '巨无霸', exact: true })).toHaveCount(0);
  await page.goForward();
  await expect(page.locator('.planet-details').getByRole('heading', { name: '巨无霸', exact: true })).toBeVisible();
  await page.goto('/atlas?food=definitely-unknown');
  await expect(page.getByRole('alert')).toContainText('找不到这颗星球');
  await page.getByRole('button', { name: '返回当前图鉴' }).click();
  await expect(page).not.toHaveURL(/food=/);
  await search.fill('does-not-exist-xyz');
  await expect(page.locator('#global-food-results')).toContainText('没有匹配的餐品');
  await page.getByRole('button', { name: '收起搜索建议' }).click();
});

test('atlas sorts real values, filters complete records, paginates and persists favorites', async ({ page }) => {
  await page.goto('/atlas'); await ready(page, 2);
  const cards = page.locator('.atlas-grid .food-card');
  await expect(cards).toHaveCount(24);
  await page.getByRole('button', { name: '再翻 24 颗星球' }).click();
  await expect(cards).toHaveCount(48);
  for (const sort of ['kcal-desc', 'kcal-asc', 'protein-desc']) {
    const key = sort === 'protein-desc' ? 'proteinG' : 'kcal';
    const sorted = [...dataset.foods].sort((a, b) => {
      const av = a.nutrition[key], bv = b.nutrition[key];
      if (av === null) return bv === null ? a.id.localeCompare(b.id) : 1;
      if (bv === null) return -1;
      return (sort === 'kcal-asc' ? av - bv : bv - av) || a.id.localeCompare(b.id);
    });
    await page.getByLabel('图鉴排序').selectOption(sort);
    await expect(cards.first().getByRole('heading')).toHaveText(sorted[0].name);
    await expect(cards.nth(1).getByRole('heading')).toHaveText(sorted[1].name);
  }
  await page.getByLabel('仅有完整营养数据').check();
  const complete = dataset.foods.filter(food => nutrientKeys.every(key => food.nutrition[key] !== null));
  await expect(page.locator('.atlas-count')).toContainText(`找到 ${complete.length} 颗星球`);
  await page.getByLabel('图鉴搜索').fill('巨无霸');
  await page.getByRole('button', { name: '收藏 巨无霸', exact: true }).click();
  await page.getByRole('button', { name: '已收藏', exact: true }).click();
  await expect(cards).toHaveCount(1);
  await page.reload(); await ready(page, 2);
  await expect(page.getByRole('button', { name: '取消收藏 巨无霸', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '取消收藏 巨无霸', exact: true }).click();
  await expect(page.getByRole('heading', { name: '这一页还没有星球' })).toBeVisible();
  await page.getByRole('button', { name: '重置筛选', exact: true }).click();
  await expect(cards).toHaveCount(24);
  await page.getByRole('button', { name: '饮品星系', exact: true }).click();
  await expect(page.locator('.atlas-count')).toContainText(`找到 ${dataset.foods.filter(food => food.category === 'drink').length} 颗星球`);
});

test('mobile atlas endpoint handoff exposes the route form and URL endpoints survive history and reload', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const destination = dataset.foods.find(food => food.name === '巨无霸')!;
  const origin = dataset.foods.find(food => food.name === '麦香鱼')!;
  await page.goto(`/atlas?food=${encodeURIComponent(destination.id)}`); await ready(page, 2);
  await page.getByRole('button', { name: '设为终点', exact: true }).click();
  await ready(page, 1);
  await expect(page.getByLabel('航线起点')).toBeVisible();
  await expect(page.getByLabel('航线起点')).toHaveValue('');
  await expect(page.getByLabel('航线终点')).toHaveValue(destination.id);
  await page.getByLabel('搜索餐品', { exact: true }).fill(origin.name);
  await page.getByRole('button', { name: `探索 ${origin.name}`, exact: true }).click();
  await page.getByRole('button', { name: '设为起点', exact: true }).click();
  await expect(page.getByLabel('航线起点')).toBeVisible();
  await expect(page.getByLabel('航线起点')).toHaveValue(origin.id);
  await expect(page.getByLabel('航线终点')).toHaveValue(destination.id);
  await page.goBack();
  await expect(page).not.toHaveURL(/from=/);
  await expect(page.getByLabel('航线起点')).toHaveValue('');
  await expect(page.getByLabel('航线终点')).toHaveValue(destination.id);
  await page.goForward();
  await expect(page.getByLabel('航线起点')).toHaveValue(origin.id);
  await expect(page.getByLabel('航线终点')).toHaveValue(destination.id);
  await page.reload(); await ready(page, 1);
  await expect(page.getByLabel('航线起点')).toBeVisible();
  await expect(page.getByLabel('航线起点')).toHaveValue(origin.id);
  await expect(page.getByLabel('航线终点')).toHaveValue(destination.id);
});

test('discovery advances across home visits and cross-category focus remains drawn without clearing search typing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await ready(page, 0);
  await page.getByRole('button', { name: '随机发现一颗星球', exact: true }).click();
  await ready(page, 1);
  const first = new URL(page.url()).searchParams.get('focus');
  await page.getByRole('button', { name: '关闭星球档案', exact: true }).click();
  await page.getByRole('link', { name: '宇宙观测站', exact: true }).click();
  await page.getByRole('button', { name: '随机发现一颗星球', exact: true }).click();
  await ready(page, 1);
  expect(new URL(page.url()).searchParams.get('focus')).not.toBe(first);
  await page.getByRole('button', { name: '关闭星球档案', exact: true }).click();
  await page.getByRole('button', { name: '饮品星系', exact: true }).click();
  await page.getByLabel('全局搜索餐品').fill('巨无霸');
  // Inside the galaxy the header search locates the planet on the map instead of leaving for the atlas.
  await page.getByLabel('全局搜索餐品').press('Enter');
  await ready(page, 1);
  await expect(page).toHaveURL(/\/galaxy\?focus=/);
  await expect(page.locator('.category-filters > button').first()).toHaveAttribute('aria-pressed', 'true');
  const search = page.getByLabel('搜索餐品', { exact: true });
  await search.pressSequentially('麦香');
  await expect(search).toHaveValue('麦香');
  await search.fill('');
  // A focused food remains pickable; closing now intentionally restores the pre-flight camera.
  const food = dataset.foods.find(item => item.name === '巨无霸')!;
  const canvas = page.locator('canvas.galaxy-canvas');
  await canvas.scrollIntoViewIfNeeded();
  await canvasScene(canvas);
  const projected = await visiblePlanet(canvas, [food.id]);
  expect(projected, 'focused planet must have an uncovered actual projected center').not.toBeNull();
  await canvas.click({ position: { x: projected!.x, y: projected!.y } });
  await expect(page.getByRole('heading', { name: food.name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: '关闭星球档案', exact: true }).click();
});

test('laboratory enforces three slots, replaces, swaps, removes and downloads a real comparison PNG', async ({ page }, info) => {
  await page.goto('/lab'); await ready(page, 3);
  const names = ['巨无霸', '双层吉士汉堡', '麦香鱼', '麦香鸡'];
  for (const name of names.slice(0, 3)) await addSample(page, name);
  await expect(page.locator('.lab-slot h2')).toHaveText(names.slice(0, 3));
  await page.getByLabel('实验室搜索').fill(names[3]);
  await expect(page.getByRole('button', { name: `添加 ${names[3]}`, exact: true })).toBeDisabled();
  await expect(page.getByRole('status').filter({ hasText: '实验台已满' })).toBeVisible();
  await page.getByRole('button', { name: '替换第 2 项', exact: true }).click();
  await page.getByRole('button', { name: `替换为 ${names[3]}`, exact: true }).click();
  await expect(page.locator('.lab-slot h2')).toHaveText([names[0], names[3], names[2]]);
  await page.getByRole('button', { name: '交换前两项', exact: true }).click();
  await expect(page.locator('.lab-slot h2')).toHaveText([names[3], names[0], names[2]]);
  await page.reload(); await ready(page, 3);
  await expect(page.locator('.lab-slot h2')).toHaveText([names[3], names[0], names[2]]);
  const first = dataset.foods.find(food => food.name === names[3])!;
  const second = dataset.foods.find(food => food.name === names[0])!;
  const delta = second.nutrition.kcal! - first.nutrition.kcal!;
  await expect(page.getByTestId('comparison-row').first()).toContainText(`第 2 项 − 第 1 项：${delta > 0 ? '+' : ''}${delta} kcal`);
  await page.getByText('这个数字如何得到？', { exact: true }).click();
  await expect(page.locator('.lab-similarity')).toContainText('log1p');
  await savePng(page, page.getByRole('button', { name: '导出星球对照卡 PNG', exact: true }), info, 'comparison-actual.png');
  await page.getByRole('button', { name: `移除 ${names[2]}`, exact: true }).click();
  await expect(page.locator('.lab-actions').first()).toContainText('2 / 3');
  await page.getByRole('button', { name: '替换第 1 项', exact: true }).click();
  await page.getByRole('button', { name: '取消替换', exact: true }).click();
  await page.getByRole('button', { name: '清空实验台', exact: true }).click();
  await expect(page.getByTestId('comparison-row')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '交换前两项' })).toBeDisabled();
  await page.reload(); await ready(page, 3);
  await expect(page.locator('.lab-actions').first()).toContainText('0 / 3');
});

test('all available daily quests require real answers and explicit route planning, claim once and persist', async ({ page }, info) => {
  await page.goto('/quests'); await ready(page, 4);
  const date = await page.evaluate(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; });
  const quests = createDailyQuests(dataset, graph, date);
  expect(quests.every(quest => quest.available)).toBe(true);
  await expect(page.getByLabel('领取时播放短音效')).not.toBeChecked();
  for (const quest of quests.filter(item => item.type !== 'route')) {
    const card = page.locator('.quest-card').filter({ has: page.getByRole('heading', { name: quest.title, exact: true }) });
    await card.getByRole('button', { name: '查看线索', exact: true }).click();
    await expect(card.locator('.quest-clue')).toBeVisible();
    await card.getByRole('button', { name: '收起线索', exact: true }).click();
    const start=card.getByRole('button', { name: '开始任务', exact: true });
    if(await start.count())await start.click();
    await expect(card.locator('.quest-status')).toHaveText('进行中');
    if (quest.type === 'twins') {
      await card.getByLabel('双生星第一颗').selectOption(quest.pair![0]);
      await card.getByLabel('双生星第二颗').selectOption(quest.pair![0]);
      await expect(card.getByRole('button', { name: '验证发现' })).toBeDisabled();
      await card.getByLabel('双生星第二颗').selectOption(quest.pair![1]);
    } else {
      const wrong = dataset.foods.find(food => !quest.candidates.includes(food.id))!;
      await card.getByLabel('营养星候选').selectOption(wrong.id);
      await card.getByRole('button', { name: '验证发现' }).click();
      await expect(card.getByRole('status')).toContainText('还不符合任务条件');
      await card.getByLabel('营养星候选').selectOption(quest.candidates[0]);
    }
    await card.getByRole('button', { name: '验证发现', exact: true }).click();
    await expect(card.locator('.quest-status')).toHaveText('已完成 · 待领取');
    await card.getByRole('button', { name: '领取星章', exact: true }).click();
    await expect(card.getByRole('button', { name: '星章已领取', exact: true })).toBeDisabled();
    await card.getByRole('link',{name:'继续下一项发现 ↗',exact:true}).click();
  }
  const routeCard = page.locator('.quest-card').filter({ has: page.getByRole('heading', { name: '打通星际航线', exact: true }) });
  await routeCard.getByRole('link', { name: '前往规划航线' }).click();
  await ready(page, 1);
  await expect(page.locator('.route-playback')).toHaveCount(0);
  await page.getByRole('link', { name: '探索任务', exact: true }).click();
  await expect(routeCard.locator('.quest-status')).toHaveText('进行中');
  await expect(routeCard.getByRole('button', { name: '领取星章', exact: true })).toHaveCount(0);
  await routeCard.getByRole('link', { name: '前往规划航线' }).click();
  await page.getByRole('button', { name: '出发，连接两颗星', exact: true }).click();
  await expect(page.locator('.route-playback')).toBeVisible();
  const plannedUrl=page.url();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(plannedUrl);
  await expect(page.locator('.route-playback')).toBeVisible();
  await expect(page.getByRole('button', { name: '上一站', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '下一站', exact: true }).click();
  await expect(page.getByRole('button', { name: '上一站', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '上一站', exact: true }).click();
  await page.getByRole('button', { name: '播放航线', exact: true }).click();
  await expect(page.locator('.route-playback > span')).not.toHaveText(/^1 \/ /);
  if (await page.getByRole('button', { name: '暂停航线', exact: true }).count()) await page.getByRole('button', { name: '暂停航线', exact: true }).click();
  await page.getByRole('button', { name: '退出航线', exact: true }).click();
  await expect(page.locator('.route-playback')).toHaveCount(0);
  await page.getByRole('link', { name: '探索任务', exact: true }).click();
  await routeCard.getByRole('button', { name: '领取星章', exact: true }).click();
  await expect(page.getByRole('heading', { name: '今日已得 3 枚星章', exact: true })).toBeVisible();
  await page.reload(); await ready(page, 4);
  await expect(page.getByRole('button', { name: '星章已领取', exact: true })).toHaveCount(3);
  await expect(page.getByRole('button', { name: '领取星章', exact: true })).toHaveCount(0);
  await savePng(page, page.getByRole('button', { name: '分享今日成果 PNG', exact: true }), info, 'quest-achievements.png');
});

test('official and demo favorites stay isolated and source controls preserve honest labels', async ({ page }) => {
  await page.goto('/atlas?q=巨无霸'); await ready(page, 2);
  await page.getByRole('button', { name: '收藏 巨无霸', exact: true }).click();
  await page.getByLabel('查看全局数据来源').click();
  await page.getByRole('button', { name: '切换到合成演示', exact: true }).click();
  await ready(page, 2);
  await expect(page.getByLabel('查看全局数据来源')).toContainText('非官方');
  await page.getByRole('button', { name: '已收藏', exact: true }).click();
  await expect(page.locator('.atlas-grid .food-card')).toHaveCount(0);
  await page.getByRole('button', { name: '全部', exact: true }).click();
  const demoCard = page.locator('.food-card').first();
  const demoName = await demoCard.getByRole('heading').innerText();
  await demoCard.getByRole('button', { name: `收藏 ${demoName}`, exact: true }).click();
  await page.getByRole('link', { name: '探索任务', exact: true }).click();
  await expect(page).toHaveURL(/demo=1/);
  await expect(page.getByLabel('查看全局数据来源')).toContainText('非官方');
  await page.getByLabel('查看全局数据来源').click();
  await page.getByRole('button', { name: '读取官方快照', exact: true }).click();
  await page.goto('/atlas?category=favorites'); await ready(page, 2);
  await expect(page.locator('.food-card h2')).toHaveText(['巨无霸']);
  await page.goto('/atlas?demo=1&category=favorites'); await ready(page, 2);
  await expect(page.locator('.food-card h2')).toHaveText([demoName]);
});

test('corrupt or blocked browser storage never prevents exploration', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken-json'), officialKey);
  await page.goto('/lab'); await ready(page, 3);
  await expect(page.locator('.lab-actions').first()).toContainText('0 / 3');
  await addSample(page, '巨无霸');
  await expect(page.locator('.lab-slot h2').first()).toHaveText('巨无霸');
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('blocked', 'SecurityError'); };
    Storage.prototype.getItem = () => { throw new DOMException('blocked', 'SecurityError'); };
  });
  await page.reload(); await ready(page, 3);
  await expect(page.getByRole('status').filter({ hasText: '浏览器未允许本地保存' })).toBeVisible();
  await addSample(page, '巨无霸');
  await expect(page.locator('.lab-slot h2').first()).toHaveText('巨无霸');
});

test('snapshot failures allow retry and explicit demo; empty and slow sources show real states', async ({ page }) => {
  const pattern = '**/data/nutrition.snapshot.json';
  await page.route(pattern, route => route.fulfill({ status: 500, body: 'failed' }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '星图暂时没有展开' })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.unroute(pattern);
  await page.getByRole('button', { name: '重新读取快照', exact: true }).click();
  await ready(page, 0);
  const empty = { ...snapshot, foods: [], meta: { ...snapshot.meta, count: 0, rawCount: 0 } };
  await page.route(pattern, route => route.fulfill({ json: empty }));
  await page.reload();
  await expect(page.getByRole('heading', { name: '这份快照还没有餐品' })).toBeVisible();
  await page.getByRole('button', { name: '使用合成演示数据', exact: true }).click();
  await ready(page, 0);
  await expect(page.getByLabel('查看全局数据来源')).toContainText('非官方');
  await page.unroute(pattern);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(pattern, async route => { await gate; await route.fulfill({ json: snapshot }); });
  await page.goto('/atlas');
  await expect(page.getByRole('heading', { name: '正在绘制你的小宇宙…', exact: true })).toBeVisible();
  release(); await ready(page, 2);
});

test('canvas pointer drag, zoom reset, actual planet hit and accessible relationship explanation work', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/galaxy'); await ready(page, 1);
  const canvas = page.locator('canvas.galaxy-canvas');
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute('data-camera', /distance/);
  const initial = await canvas.getAttribute('data-camera');
  const anchor = await canvas.evaluate(element => {
    const rect = element.getBoundingClientRect();
    for (const fx of [.5, .65, .8]) for (const fy of [.4, .55, .7]) {
      const x = rect.left + rect.width * fx, y = rect.top + rect.height * fy;
      if (document.elementFromPoint(x, y) === element && document.elementFromPoint(x + 65, y + 30) === element) return { x, y };
    }
    return null;
  });
  expect(anchor, 'orbit must start and finish on uncovered canvas').not.toBeNull();
  await page.mouse.move(anchor!.x, anchor!.y);
  await page.mouse.down();
  await page.mouse.move(anchor!.x + 65, anchor!.y + 30, { steps: 6 });
  await page.mouse.up();
  await expect(canvas).not.toHaveAttribute('data-camera', initial!);
  expect(new URL(page.url()).searchParams.has('focus')).toBe(false);
  const zoom = await page.locator('.zoom-tools span').innerText();
  const beforeDolly = (await canvasScene(canvas)).camera.distance;
  await page.mouse.move(anchor!.x, anchor!.y); await page.mouse.wheel(0, -180);
  await expect(page.locator('.zoom-tools span')).not.toHaveText(zoom);
  await expect.poll(async () => (await canvasScene(canvas)).camera.distance).toBeLessThan(beforeDolly);
  await page.getByRole('button', { name: '缩小', exact: true }).click();
  await page.getByRole('button', { name: '放大', exact: true }).click();
  await page.getByRole('button', { name: '重置视图', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-camera', initial!);
  await canvasScene(canvas);
  const target = await visiblePlanet(canvas, graph.edges.flatMap(edge => [edge.source, edge.target]));
  expect(target).not.toBeNull();
  await canvas.click({ position: { x: target!.x, y: target!.y } });
  const food = dataset.foods.find(item => item.id === target!.id)!;
  await expect(page.getByRole('heading', { name: food.name, exact: true })).toBeVisible();
  await page.getByLabel('显示名称', { exact: true }).check();
  await page.getByRole('button', { name: '查看更多关系', exact: true }).click();
  await page.locator('.accessible-relations summary').click();
  await page.locator('.accessible-relations button').first().click();
  await expect(page.getByRole('region', { name: '关系解释', exact: true })).toContainText('比较维度');
  await page.getByRole('button', { name: '收起关系解释', exact: true }).click();
  await expect(page.getByRole('region', { name: '关系解释', exact: true })).toHaveCount(0);
  await page.getByLabel('显示关系', { exact: true }).uncheck();
  await expect(page.locator('.accessible-relations')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: food.name, exact: true })).toHaveCount(0);
});

test('lens and category changes preserve the world; category controls fly and food focus restores roaming', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/galaxy'); await ready(page, 1);
  const canvas = page.locator('canvas.galaxy-canvas');
  const { camera: home } = await canvasScene(canvas);
  const world = await canvas.getAttribute('data-world');
  await page.getByRole('button', { name: '蛋白质', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-lens', 'proteinG');
  expect(await canvas.getAttribute('data-world')).toBe(world);
  await page.getByRole('button', { name: '饮品星系', exact: true }).click();
  await expect.poll(async () => (await canvasScene(canvas)).camera.target).not.toEqual(home.target);
  expect(await canvas.getAttribute('data-world')).toBe(world);
  await page.getByRole('button', { name: '重置视图', exact: true }).click();
  // Clear the directory filter before entering another cluster through its sky label.
  await page.locator('.category-filters > button').first().click();
  await page.getByRole('button', { name: '返回星系全景', exact: true }).click();
  const overview = (await canvasScene(canvas)).camera;
  const cluster = page.getByRole('button', { name: '进入汉堡星系', exact: true });
  await expect(cluster).toBeVisible();
  await cluster.click();
  await expect.poll(async () => (await canvasScene(canvas)).camera.target).not.toEqual(overview.target);
  expect(await canvas.getAttribute('data-world')).toBe(world);
  const roaming = (await canvasScene(canvas)).camera;
  const search = page.getByLabel('搜索餐品', { exact: true });
  await search.fill('巨无霸');
  await page.getByRole('button', { name: '探索 巨无霸', exact: true }).click();
  await expect(page.getByRole('heading', { name: '巨无霸', exact: true })).toBeVisible();
  await expect.poll(async () => (await canvasScene(canvas)).camera.target).not.toEqual(roaming.target);
  const focusId = dataset.foods.find(food => food.name === '巨无霸')!.id;
  await expect.poll(async () => {
    const projected = JSON.parse((await canvas.getAttribute('data-planets'))!) as ProjectedPlanet[];
    return projected.some(planet => planet.id === focusId && planet.visible && planet.radius > 0);
  }).toBe(true);
  await page.getByRole('button', { name: '返回漫游视角', exact: true }).click();
  await expect.poll(async () => (await canvasScene(canvas)).camera).toEqual(roaming);
  expect(await canvas.getAttribute('data-world')).toBe(world);
  // A category command also exits an open food archive and frames its volume.
  await search.fill('巨无霸');
  await page.getByRole('button',{name:'探索 巨无霸',exact:true}).click();
  const focused=(await canvasScene(canvas)).camera.target;
  await page.getByRole('button',{name:'饮品星系',exact:true}).click();
  await expect(page.getByRole('heading',{name:'巨无霸',exact:true})).toBeHidden();
  await expect.poll(async()=>(await canvasScene(canvas)).camera.target).not.toEqual(focused);
  expect(await canvas.getAttribute('data-world')).toBe(world);
});

test('clicking a visible canvas relationship opens its real explanation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/galaxy'); await ready(page, 1);
  const world = JSON.parse((await page.locator('canvas.galaxy-canvas').getAttribute('data-world'))!) as { id: string; x: number; y: number; z: number }[];
  const byId = new Map(world.map(point => [point.id, point]));
  const length = (edge: typeof graph.edges[number]) => {
    const a = byId.get(edge.source)!, b = byId.get(edge.target)!;
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  };
  const edge = [...graph.edges].sort((a, b) => length(b) - length(a))[0];
  // Fit both real endpoints through the route UI: focusing one dense cluster
  // hid the long edge behind the archive or outside the initial viewport.
  await page.goto(`/galaxy?from=${encodeURIComponent(edge.source)}&to=${encodeURIComponent(edge.target)}`); await ready(page, 1);
  await page.getByRole('button', { name: '出发，连接两颗星', exact: true }).click();
  await expect(page.locator('.route-playback')).toBeVisible();
  await page.getByRole('button', { name: '下一站', exact: true }).click();
  await expect(page.locator('.route-playback > span')).toContainText('2 / 2');
  const canvas = page.locator('canvas.galaxy-canvas');
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute('data-camera', /distance/);
  // Hit the actual projected polyline; exclude every visible planet and floating UI.
  async function visibleEdgePoint() {
    await canvasScene(canvas);
    const edges = JSON.parse((await canvas.getAttribute('data-edges'))!) as ProjectedEdge[];
    const rendered = edges.find(item => (item.source === edge.source && item.target === edge.target) || (item.source === edge.target && item.target === edge.source));
    expect(rendered, 'planned relationship must be present in the actual renderer').toBeDefined();
    const curve = rendered!.points;
    const planets = JSON.parse((await canvas.getAttribute('data-planets'))!) as ProjectedPlanet[];
    const candidates = curve.slice(1).flatMap((point, index) => {
      const previous = curve[index];
      return [.25, .5, .75].map(t => ({ x: previous.x + (point.x - previous.x) * t, y: previous.y + (point.y - previous.y) * t, z: previous.z + (point.z - previous.z) * t }));
    }).filter(point => point.z >= -1 && point.z <= 1 && planets.every(planet => !planet.visible || Math.hypot(planet.x - point.x, planet.y - point.y) > planet.radius + 7));
    return openCanvasPoint(canvas, candidates);
  }
  const point = await visibleEdgePoint();
  expect(point, 'a visible relationship segment must be available for pointer hit testing').not.toBeNull();
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.move(bounds.x + point!.x, bounds.y + point!.y);
  const beforeZoom = (await canvasScene(canvas)).camera.distance;
  await page.mouse.wheel(0, -240);
  await expect.poll(async () => (await canvasScene(canvas)).camera.distance).toBeLessThan(beforeZoom);
  const afterZoom = await visibleEdgePoint();
  expect(afterZoom, 'the projected edge must remain visible after depth-aware wheel zoom').not.toBeNull();
  await canvas.click({ position: afterZoom! });
  await expect(page.getByRole('region', { name: '关系解释', exact: true })).toContainText(edge.explanation);
});

for (const width of [1440, 768, 390, 360]) {
  test(`five-page visual evidence and deep-link details fit ${width}px`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: width >= 768 ? 1024 : 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (let index = 0; index < routes.length; index++) {
      await page.goto(routes[index]); await ready(page, index);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath(`page-${index + 1}-${width}.png`), fullPage: true });
    }
    for (const [route, query] of [['/atlas', 'food'], ['/galaxy', 'focus']]) {
      const food = dataset.foods.find(item => item.name === '巨无霸')!;
      await page.goto(`${route}?${query}=${encodeURIComponent(food.id)}`);
      await ready(page, route === '/atlas' ? 2 : 1);
      const details = page.getByRole('complementary', { name: '巨无霸星球档案', exact: true });
      await expect(details).toBeVisible();
      await expect(details.getByRole('button', { name: '关闭星球档案' })).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath(`${query}-details-${width}.png`), fullPage: true });
      await page.reload(); await ready(page, route === '/atlas' ? 2 : 1);
      await expect(details).toBeVisible();
      await details.getByRole('button', { name: '关闭星球档案' }).click();
      await expect(details).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}

test('flow: slash search, in-map route feedback, atlas typing history and lab shortcuts', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/galaxy?guide=1'); await ready(page, 1);
  const map = page.getByRole('region', { name: '互动餐品星图' });
  await expect(map.getByRole('region', { name: '星系探索引导' })).toBeVisible();
  // The working surface starts above the fold.
  expect((await map.boundingBox())!.y).toBeLessThan(250);
  await page.keyboard.press('/');
  await expect(page.getByLabel('全局搜索餐品')).toBeFocused();
  await page.keyboard.type('巨无霸'); await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '巨无霸', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: '星系探索引导' })).toHaveCount(0);
  await expect(page).not.toHaveURL(/guide=/);
  await page.getByRole('button', { name: '设为终点', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '再选一颗起点' })).toBeVisible();
  await page.getByLabel('航线起点').selectOption({ label: '麦香鱼' });
  await page.getByRole('button', { name: '出发，连接两颗星', exact: true }).click();
  // Route result and playback render inside the map, not below the fold.
  await expect(map.getByRole('region', { name: '航线结果' })).toBeInViewport();
  await expect(map.getByLabel('航线播放控制')).toBeVisible();
  await page.goto('/atlas'); await ready(page, 2);
  const before = await page.evaluate(() => history.length);
  await page.getByLabel('图鉴搜索').pressSequentially('麦香');
  expect(await page.evaluate(() => history.length)).toBe(before);
  await page.getByRole('button', { name: '实验室添加 麦香鱼', exact: true }).click();
  await expect(page.getByRole('button', { name: '实验室移除 麦香鱼', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '查看 麦香鸡', exact: true }).click();
  await page.getByRole('button', { name: '加入实验室', exact: true }).click();
  await page.getByRole('button', { name: /去实验室比较/ }).click();
  await ready(page, 3);
  await expect(page.locator('.lab-slot h2').first()).toHaveText('麦香鱼');
  await page.getByRole('button', { name: /等待一颗星球/ }).click();
  await expect(page.getByLabel('实验室搜索')).toBeFocused();
  await page.getByLabel('收藏与最近查看').getByRole('button', { name: '＋ 巨无霸' }).click();
  await expect(page.locator('.lab-slot h2')).toHaveText(['麦香鱼', '麦香鸡', '巨无霸']);
});
