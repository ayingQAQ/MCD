import { expect, test, type Locator, type Page } from '@playwright/test';
import snapshot from '../../public/data/nutrition.snapshot.json' with { type: 'json' };

type Camera = { position: number[]; target: number[]; distance: number };
type Planet = { id: string; x: number; y: number; z: number; radius: number; visible: boolean };
type Edge = { points: { x: number; y: number; z: number }[] };
const camera = async (canvas: Locator): Promise<Camera> => JSON.parse((await canvas.getAttribute('data-camera'))!);

async function openGalaxy(page: Page, path = '/galaxy', width = 1440) {
  await page.setViewportSize({ width, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(path);
  await expect(page.getByRole('heading', { name: '营养星系', exact: true })).toBeVisible();
  const canvas = page.locator('canvas.galaxy-canvas');
  await expect(canvas).toHaveAttribute('data-camera', /distance/);
  await expect(canvas).toHaveAttribute('data-total', String(snapshot.foods.length));
  await expect.poll(async () => Number(await canvas.getAttribute('data-rendered'))).toBeGreaterThan(0);
  await canvas.scrollIntoViewIfNeeded();
  return canvas;
}

// Only read the real renderer's projections. Native mouse events below perform every pick.
async function canvasPoint(canvas: Locator, kind: 'empty' | 'small-planet' | 'wheel') {
  return canvas.evaluate((element, mode) => {
    const rect = element.getBoundingClientRect();
    const planets = JSON.parse(element.getAttribute('data-planets')!) as Planet[];
    const edges = JSON.parse(element.getAttribute('data-edges') ?? '[]') as Edge[];
    const exposed = (x: number, y: number) => x > 24 && y > 24 && x < rect.width - 24 && y < rect.height - 24
      && document.elementFromPoint(rect.left + x, rect.top + y) === element;
    const farFromEdges = (x: number, y: number) => edges.every(edge => edge.points.every((b, index) => {
      if (!index) return true;
      const a = edge.points[index - 1];
      if ((a.z < -1 && b.z < -1) || (a.z > 1 && b.z > 1)) return true;
      const dx = b.x - a.x, dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
      return Math.hypot(x - a.x - t * dx, y - a.y - t * dy) > 18;
    }));
    const point = (x: number, y: number, id?: string) => ({ x: rect.left + x, y: rect.top + y, id });
    if (mode === 'small-planet') {
      // Conservative sphere bounds include perspective. Start outside those bounds,
      // so an exact mesh raycast cannot satisfy this accessibility regression.
      const small = planets.filter(p => p.visible && p.radius > 0 && p.radius <= 8).sort((a, b) => a.radius - b.radius);
      for (const planet of small) for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const distance = planet.radius + 4;
        const x = planet.x + Math.cos(angle) * distance, y = planet.y + Math.sin(angle) * distance;
        if (exposed(x, y) && farFromEdges(x, y) && planets.every(other => !other.visible || other.id === planet.id
          || Math.hypot(x - other.x, y - other.y) > Math.max(24, other.radius + 16))) return point(x, y, planet.id);
      }
      return null;
    }
    for (const fx of [.7, .8, .6, .9, .5, .4]) for (const fy of [.4, .3, .55, .65, .2, .75]) {
      const x = rect.width * fx, y = rect.height * fy;
      if (!exposed(x, y)) continue;
      if (mode === 'wheel' || (farFromEdges(x, y) && planets.every(p => !p.visible || Math.hypot(x - p.x, y - p.y) > p.radius + 36))) return point(x, y);
    }
    return null;
  }, kind);
}

test.describe('comfortable galaxy pointer navigation', () => {
  test.setTimeout(60_000);

  test('category focus hides unrelated labels and overview restores every food filter', async ({ page }, info) => {
    const canvas = await openGalaxy(page);
    const world = await canvas.getAttribute('data-world');
    await page.getByRole('button', { name: '汉堡星系', exact: true }).click();
    await expect(page.getByRole('button', { name: '汉堡星系', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas).toHaveAttribute('data-total', String(snapshot.foods.filter(food => food.category === 'burger').length));
    for (const label of ['早安星系', '小食星系', '饮品星系', '甜点星系', '未知星域']) {
      await expect(page.getByRole('button', { name: `进入${label}`, exact: true, includeHidden: true })).toBeHidden();
    }
    await page.getByRole('button', { name: '返回星系全景', exact: true }).click();
    await expect(page.getByRole('button', { name: /^全部星球/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas).toHaveAttribute('data-total', '158');
    // The directory is the filter's complete set; perspective visibility is only a subset.
    await expect(page.locator('.food-directory button')).toHaveCount(snapshot.foods.length);
    await expect.poll(async () => {
      const projected = JSON.parse((await canvas.getAttribute('data-planets'))!) as Planet[];
      return projected.some(p => p.visible && snapshot.foods.find(food => food.id === p.id)?.category !== 'burger');
    }).toBe(true);
    expect(await canvas.getAttribute('data-world')).toBe(world);
    await page.screenshot({ path: info.outputPath('galaxy-comfort-overview-1440.png'), fullPage: true });
  });

  test('empty canvas clicks preserve deep linked details until Escape at 1112px', async ({ page }, info) => {
    const food = snapshot.foods.find(item => item.name === '巨无霸')!;
    const canvas = await openGalaxy(page, `/galaxy?focus=${encodeURIComponent(food.id)}`, 1112);
    const details = page.getByRole('heading', { name: food.name, exact: true });
    await expect(details).toBeVisible();
    const before = await camera(canvas), world = await canvas.getAttribute('data-world');
    const point = await canvasPoint(canvas, 'empty');
    expect(point, 'an exposed point away from all rendered planets and nutrient edges').not.toBeNull();
    await page.mouse.click(point!.x, point!.y);
    await expect(details).toBeVisible();
    expect(new URL(page.url()).searchParams.get('focus')).toBe(food.id);
    await expect.poll(async () => camera(canvas)).toEqual(before);
    expect(await canvas.getAttribute('data-world')).toBe(world);
    await page.screenshot({ path: info.outputPath('galaxy-comfort-selected-1112.png'), fullPage: true });
    await page.keyboard.press('Escape');
    await expect(details).toBeHidden();
    await expect.poll(() => new URL(page.url()).searchParams.has('focus')).toBe(false);
  });

  test('a small distant planet has a forgiving hover and click target outside its sphere', async ({ page }, info) => {
    const canvas = await openGalaxy(page);
    const world = await canvas.getAttribute('data-world');
    // The home view looks through a crowded drink cluster. Browse the sparse
    // seven-food category, then back away using the real toolbar until its
    // projected spheres are small enough to exercise the forgiving hit area.
    await page.getByRole('button', { name: '未知星域', exact: true }).click();
    await expect(canvas).toHaveAttribute('data-total', String(snapshot.foods.filter(food => food.category === 'other').length));
    let point = await canvasPoint(canvas, 'small-planet');
    for (let step = 0; !point && step < 10; step++) {
      const before = (await camera(canvas)).distance;
      await page.getByRole('button', { name: '缩小', exact: true }).click();
      await expect.poll(async () => (await camera(canvas)).distance).toBeGreaterThan(before);
      point = await canvasPoint(canvas, 'small-planet');
    }
    expect(point, 'an isolated small sphere with an exposed point four pixels beyond its conservative projection').not.toBeNull();
    const food = snapshot.foods.find(item => item.id === point!.id)!;
    expect(food.category).toBe('other');
    await page.mouse.move(point!.x, point!.y);
    await expect(page.locator('.planet-hover-card')).toContainText(food.name);
    await expect(page.locator('.planet-hover-card')).toBeVisible();
    await page.screenshot({ path: info.outputPath('galaxy-comfort-hover-1440.png'), fullPage: true });
    await page.mouse.click(point!.x, point!.y);
    await expect(page.getByRole('heading', { name: food.name, exact: true })).toBeVisible();
    expect(new URL(page.url()).searchParams.get('focus')).toBe(food.id);
    expect(await canvas.getAttribute('data-world')).toBe(world);
  });

  test('wheel zoom at an off-centre canvas point advances toward the cursor', async ({ page }) => {
    const canvas = await openGalaxy(page);
    const before = await camera(canvas), world = await canvas.getAttribute('data-world');
    const point = await canvasPoint(canvas, 'wheel');
    expect(point, 'wheel input needs exposed canvas away from the view centre').not.toBeNull();
    await page.mouse.move(point!.x, point!.y);
    await page.mouse.wheel(0, -180);
    await expect.poll(async () => (await camera(canvas)).distance).toBeLessThan(before.distance);
    await expect.poll(async () => (await camera(canvas)).target).not.toEqual(before.target);
    expect(new URL(page.url()).searchParams.has('focus')).toBe(false);
    expect(await canvas.getAttribute('data-world')).toBe(world);
  });
});
