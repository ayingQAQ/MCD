import { expect, test } from '@playwright/test';

test('official snapshot, search, lenses, details and PNG export', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('官方营养快照', { exact: true }).first()).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible();
  await page.getByLabel('搜索餐品').fill('巨无霸');
  await page.getByRole('button', { name: '探索 巨无霸', exact: true }).click();
  await expect(page.getByRole('heading', { name: '巨无霸', exact: true })).toBeVisible();
  await expect(page.getByText('513 kcal', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: '蛋白质', exact: true }).click();
  await expect(page.getByRole('button', { name: '蛋白质', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '保存星球卡片' }).click();
  const card = await download;
  expect(card.suggestedFilename()).toMatch(/\.png$/);
  await card.saveAs(testInfo.outputPath('planet-card.png'));
  await expect(page.getByLabel('搜索餐品')).toHaveValue('');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: '巨无霸', exact: true })).toBeHidden();
  expect(errors).toEqual([]);
});

test('filters, no results, honest demo mode and no automatic official fallback', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.getByText('合成示例数据 · 非官方营养信息', { exact: true }).first()).toBeVisible();
  await page.getByLabel('搜索餐品').fill('不存在的星球xyz');
  await expect(page.getByText('还没有找到这颗星球')).toBeVisible();
  await page.goto('/');
  await page.getByRole('button', { name: '饮品星系', exact: true }).click();
  await expect(page.getByRole('button', { name: '饮品星系', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.route('**/data/nutrition.snapshot.json', route => route.fulfill({ status: 500, body: 'failed' }));
  await page.reload();
  await expect(page.getByRole('heading', { name: '星图暂时没有展开' })).toBeVisible();
  await expect(page.getByRole('button', { name: '使用合成演示数据' })).toBeVisible();
});

test('route steps and discoveries are usable', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: '规划航线', exact: true }).click();
  await page.getByLabel('航线起点').selectOption({ label: '巨无霸' });
  await page.getByLabel('航线终点').selectOption({ label: '双层吉士汉堡' });
  await page.getByRole('button', { name: '出发，连接两颗星' }).click();
  await expect(page.getByRole('status').filter({ hasText: /跳|没有可达/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('route.png'), fullPage: true });
  await page.getByRole('button', { name: '双生星', exact: true }).click();
  await expect(page.getByRole('heading', { name: '双生星发现' })).toBeVisible();
  await page.locator('.discovery-results > button').first().click();
  await expect(page.getByLabel('双生星连接')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('twins.png'), fullPage: true });
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
  test(`visual evidence ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('canvas').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByText(/正在绘制/)).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`atlas-${viewport.width}.png`), fullPage: true });
    await page.getByLabel('搜索餐品').fill('巨无霸');
    await page.getByRole('button', { name: '探索 巨无霸', exact: true }).click();
    await expect(page.getByRole('heading', { name: '巨无霸', exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`details-${viewport.width}.png`), fullPage: true });
  });
}
