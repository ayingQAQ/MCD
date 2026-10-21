import { expect, test, type Locator } from '@playwright/test';

type Camera = { position: [number, number, number]; target: [number, number, number]; distance: number };
type Planet = { id: string; x: number; y: number; radius: number; z: number; visible: boolean };
const camera = async (canvas: Locator): Promise<Camera> => JSON.parse((await canvas.getAttribute('data-camera'))!);
const planets = async (canvas: Locator): Promise<Planet[]> => JSON.parse((await canvas.getAttribute('data-planets'))!);

async function dragAnchor(canvas: Locator) {
  return canvas.evaluate(element => {
    const rect = element.getBoundingClientRect();
    for (const fx of [.65, .8, .5, .35]) for (const fy of [.4, .55, .3, .7]) {
      const x = rect.left + rect.width * fx, y = rect.top + rect.height * fy;
      if (x + 65 < innerWidth && y + 25 < innerHeight && document.elementFromPoint(x, y) === element && document.elementFromPoint(x + 65, y + 25) === element) return { x, y };
    }
    return null;
  });
}

test('native right drag reveals another region; reset is local and universe overview fits more planets', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/galaxy');
  const canvas = page.locator('canvas.galaxy-canvas');
  await expect(canvas).toHaveAttribute('data-scene', 'webgl-3d');
  await expect(canvas).toHaveAttribute('data-window', /food-/);
  const initial = JSON.parse((await canvas.getAttribute('data-window'))!) as string[];
  const home = await camera(canvas);
  await canvas.scrollIntoViewIfNeeded();
  const anchor = await dragAnchor(canvas);
  expect(anchor, 'right drag requires uncovered canvas').not.toBeNull();
  for (let step = 0; step < 6; step++) {
    await page.mouse.move(anchor!.x, anchor!.y);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(anchor!.x + 65, anchor!.y + 25, { steps: 8 });
    await page.mouse.up({ button: 'right' });
  }
  await expect.poll(async () => (await camera(canvas)).target).not.toEqual(home.target);
  await expect.poll(async () => {
    const next = JSON.parse((await canvas.getAttribute('data-window'))!) as string[];
    return next.some(id => !initial.includes(id));
  }).toBe(true);
  await page.screenshot({ path: info.outputPath('universe-distant-region.png'), fullPage: true });
  await page.getByRole('button', { name: '重置视图', exact: true }).click();
  await expect.poll(async () => camera(canvas)).toEqual(home);
  await expect.poll(async () => JSON.parse((await canvas.getAttribute('data-window'))!)).toEqual(initial);
  expect(initial.length).toBeLessThan(Number(await canvas.getAttribute('data-total')));
  await page.getByRole('button', { name: '返回星系全景', exact: true }).click();
  await expect.poll(async () => (await camera(canvas)).distance).toBeGreaterThan(home.distance);
  await expect.poll(async () => Number(await canvas.getAttribute('data-rendered'))).toBeGreaterThan(initial.length);
});

for (const width of [1440, 390]) for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`WebGL perspective rotates in 3D and survives resize at ${width}px, motion ${reducedMotion}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
    await page.emulateMedia({ reducedMotion });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/galaxy');
    await expect(page.getByRole('heading', { name: '营养星系', exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const canvas = page.locator('canvas.galaxy-canvas');
    await expect(canvas).toHaveAttribute('data-scene', 'webgl-3d');
    await expect(canvas).toHaveAttribute('data-camera', /distance/);
    expect(await canvas.evaluate(element => {
      const gl = (element as HTMLCanvasElement).getContext('webgl2');
      return gl instanceof WebGL2RenderingContext && !gl.isContextLost() && gl.getParameter(gl.VERSION).includes('WebGL 2');
    })).toBe(true);
    await expect.poll(async () => Number(await canvas.getAttribute('data-rendered'))).toBeGreaterThan(0);
    expect(Number(await canvas.getAttribute('data-rendered'))).toBeLessThan(Number(await canvas.getAttribute('data-total')));
    const world = await canvas.getAttribute('data-world');
    const coordinates = JSON.parse(world!) as { id: string; x: number; y: number; z: number }[];
    expect(new Set(coordinates.map(point => point.z)).size).toBeGreaterThan(2);
    await canvas.scrollIntoViewIfNeeded();
    const before = await camera(canvas), projectedBefore = await planets(canvas);
    const imageBefore = await canvas.screenshot({ path: info.outputPath(`depth-default-${width}-${reducedMotion}.png`) });
    const anchor = await dragAnchor(canvas);
    expect(anchor, 'native orbit requires uncovered canvas').not.toBeNull();
    await page.mouse.move(anchor!.x, anchor!.y);
    await page.mouse.down();
    await page.mouse.move(anchor!.x + 65, anchor!.y + 25, { steps: 8 });
    await page.mouse.up();
    await expect.poll(async () => (await camera(canvas)).position).not.toEqual(before.position);
    const after = await camera(canvas);
    expect(after.target).toEqual(before.target);
    expect(after.distance).toBeCloseTo(before.distance, 1);
    expect(Math.abs(after.position[0] - before.position[0]) + Math.abs(after.position[2] - before.position[2])).toBeGreaterThan(1);
    expect(new URL(page.url()).searchParams.has('focus')).toBe(false);
    const projectedAfter = await planets(canvas);
    const common = projectedBefore.filter(point => point.visible).flatMap(point => {
      const next = projectedAfter.find(item => item.id === point.id && item.visible);
      return next ? [{ before: point, after: next }] : [];
    });
    expect(common.length).toBeGreaterThan(2);
    // Rotation changes relative screen geometry; translating a flat picture cannot satisfy this.
    const anchorPlanet = common[0];
    expect(Math.max(...common.slice(1).map(point => Math.hypot(
      (point.after.x - anchorPlanet.after.x) - (point.before.x - anchorPlanet.before.x),
      (point.after.y - anchorPlanet.after.y) - (point.before.y - anchorPlanet.before.y),
    )))).toBeGreaterThan(.5);
    expect(await canvas.getAttribute('data-world')).toBe(world);
    await page.mouse.move(1, 1);
    const imageAfter = await canvas.screenshot({ path: info.outputPath(`depth-orbited-${width}-${reducedMotion}.png`) });
    expect(imageAfter.equals(imageBefore)).toBe(false);
    await page.screenshot({ path: info.outputPath(`depth-page-${width}-${reducedMotion}.png`), fullPage: true });
    await page.setViewportSize({ width: width - 30, height: width > 1000 ? 900 : 800 });
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('data-scene', 'webgl-3d');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`depth-resized-${width}-${reducedMotion}.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}
