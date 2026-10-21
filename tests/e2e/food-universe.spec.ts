import { expect, test } from '@playwright/test';
import snapshot from '../../public/data/nutrition.snapshot.json' with { type: 'json' };
import manifest from '../../src/data/food-images.json' with { type: 'json' };

for (const width of [390, 1112, 1440]) {
  test(`home mission copy keeps a readable column at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const cards = page.locator('.mission-preview');
    await expect(cards).toHaveCount(3);
    for (const card of await cards.all()) {
      const body = card.locator(':scope > p');
      const link = card.locator(':scope > a');
      const p = (await body.boundingBox())!, action = (await link.boundingBox())!;
      expect(p.width).toBeGreaterThan(210);
      expect(action.y).toBeGreaterThanOrEqual(p.y + p.height - 1);
    }
    await cards.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`home-missions-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('real product photos and local cartoon textures have separate roles', async ({ page }, info) => {
  const food = snapshot.foods.find(food => food.name === '巨无霸')!;
  const image = manifest.images.find(image => image.foodId === food.id)!;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const external: string[] = [];
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) { external.push(url.hostname); return route.abort(); }
    return route.continue();
  });
  await page.goto(`/galaxy?focus=${food.id}`);
  const canvas = page.locator('canvas.galaxy-canvas');
  await expect(canvas).toHaveAttribute('data-food-textures', /"loaded":\d+/);
  await expect.poll(async () => JSON.parse((await canvas.getAttribute('data-food-textures'))!).failed).toBe(0);
  await expect.poll(async () => { const art = JSON.parse((await canvas.getAttribute('data-food-textures'))!); return art.total > 5 && art.loaded === art.total; }).toBe(true);
  const photo = page.locator('.planet-details .food-photo img');
  await expect(photo).toHaveAttribute('src', image.src);
  await expect.poll(() => photo.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(100);
  expect(external).toEqual([]);
  await page.screenshot({ path: info.outputPath('food-galaxy-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: '关闭星球档案', exact: true }).click();
  await page.screenshot({ path: info.outputPath('food-universe-desktop.png'), fullPage: true });
});

test('a broken verified photo falls back honestly without a wrong product image', async ({ page }) => {
  const food = snapshot.foods.find(food => food.name === '巨无霸')!;
  await page.route('**/food-photos/**', route => route.abort());
  await page.goto(`/atlas?food=${food.id}`);
  await expect(page.locator('.planet-details .food-photo')).toContainText('暂无已核实商品图片');
  await expect(page.locator('.planet-details .food-photo img')).toHaveCount(0);
});

for (const width of [390, 1112]) {
  test(`focused food leaves camera controls reachable at ${width}px`, async ({ page }, info) => {
    const food = snapshot.foods.find(food => food.name === '巨无霸')!;
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/galaxy?focus=${food.id}`);
    await expect(page.locator('canvas.galaxy-canvas')).toHaveAttribute('data-camera', /distance/);
    for (const name of ['放大', '缩小', '返回漫游视角']) {
      const button = page.getByRole('button', { name, exact: true });
      await expect(button).toBeVisible();
      expect(await button.evaluate(element => {
        const box = element.getBoundingClientRect();
        const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return !!hit && element.contains(hit);
      })).toBe(true);
    }
    const sheet = (await page.locator('.planet-details').boundingBox())!;
    const zoom = (await page.locator('.zoom-tools').boundingBox())!;
    if (width < 600) expect(sheet.y + sheet.height).toBeLessThan(zoom.y);
    await page.screenshot({ path: info.outputPath(`food-focus-controls-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: '返回漫游视角', exact: true }).click();
    await expect(page.locator('.planet-details')).toHaveCount(0);
  });
}
