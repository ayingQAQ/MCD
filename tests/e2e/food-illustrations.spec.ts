import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('gallery exposes distinct families, sizes, expressions and independent SVG download', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/illustrations.html');
  await expect(page.getByRole('heading', { name: /餐品贴纸工坊/ })).toBeVisible();
  expect(await page.locator('.food-art-tile').count()).toBeGreaterThanOrEqual(20);
  const families = await page.locator('.food-art-tile svg').evaluateAll(nodes => [...new Set(nodes.map(node => node.getAttribute('data-family')))]);
  expect(families.length).toBe(8);
  await page.getByLabel('选择变体').selectOption('burger-double');
  await page.getByLabel('角色表情').selectOption('curious');
  await page.getByLabel('插画尺寸').selectOption('48');
  await expect(page.locator('.food-art-tile svg').first()).toHaveAttribute('width', '48');
  await page.getByRole('checkbox', { name: '宇宙角色模式', exact: true }).check();
  await expect(page.locator('.inspector-art [data-cosmic]').first()).toBeVisible();
  await page.getByLabel('插画尺寸').selectOption('256');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: /导出独立 SVG/ }).click();
  const download = await pending; const path = testInfo.outputPath('burger-double.svg');
  await download.saveAs(path);
  const svg = await readFile(path, 'utf8');
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  expect(svg).toContain('width="256"');
  expect(svg).not.toMatch(/<image|<script|@font-face|@keyframes|url\(https?:/);
  await page.goto(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  await expect(page.locator('svg')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('standalone-svg.png') });
  expect(errors).toEqual([]);
});

test('food body stays identifiable without faces or cosmic decoration and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/illustrations.html');
  await page.getByLabel('角色表情').selectOption('neutral');
  await expect(page.locator('.food-art-tile [data-expression]')).toHaveCount(0);
  await expect(page.locator('.food-art-tile [data-cosmic]')).toHaveCount(0);
  await page.getByRole('checkbox', { name: '仅选中项轻动效', exact: true }).check();
  expect(await page.locator('.inspector-art .mc-food-motion').evaluate(node => getComputedStyle(node).animationName)).toBe('none');
  await page.getByLabel('食物类别').selectOption('burger');
  const pattyCounts = await page.locator('.food-art-tile svg').evaluateAll(nodes => nodes.map(node => node.querySelectorAll('[data-ingredient="beef"], [data-ingredient="chicken"]').length));
  expect(pattyCounts).toContain(1); expect(pattyCounts).toContain(2);
});

for (const background of ['light', 'dark', 'checker']) test(`food art evidence on ${background} background`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/illustrations.html');
  await page.getByRole('button', { name: background === 'light' ? '浅色' : background === 'dark' ? '深色' : '透明棋盘', exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath(`food-sheet-${background}.png`), fullPage: true, animations: 'disabled' });
});

test('mobile workshop controls remain usable without horizontal overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/illustrations.html');
  await page.getByLabel('食物类别').selectOption('dessert');
  await page.getByLabel('插画尺寸').selectOption('64');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('food-gallery-mobile.png'), fullPage: true, animations: 'disabled' });
});
