import { expect, test } from '@playwright/test';

test('settled galaxy stops animation callbacks and wakes for camera input', async ({ page }, info) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const probe = { callbacks: 0 };
    Object.defineProperty(window, '__sceneProbe', { value: probe });
    const request = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => request(time => { probe.callbacks++; callback(time); });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/galaxy');
  const canvas = page.locator('canvas.galaxy-canvas');
  await expect.poll(async () => {
    const textures = JSON.parse((await canvas.getAttribute('data-food-textures')) ?? '{}');
    return textures.total > 0 && textures.loaded === textures.total && !textures.failed;
  }).toBe(true);
  await page.mouse.move(1, 1);
  const measure = () => page.evaluate(async () => {
    const count = () => (window as unknown as { __sceneProbe: { callbacks: number } }).__sceneProbe.callbacks;
    const before = count();
    await new Promise(resolve => setTimeout(resolve, 400));
    return count() - before;
  });
  const callbacks = await measure();
  await info.attach('idle-animation-callbacks.json', { body: JSON.stringify({ callbacks }), contentType: 'application/json' });
  expect(callbacks, 'a still universe should not keep running CPU work').toBeLessThanOrEqual(1);
  const before = await canvas.getAttribute('data-camera');
  await page.getByRole('button', { name: '放大', exact: true }).click();
  await expect(canvas).not.toHaveAttribute('data-camera', before!);
  await expect.poll(measure).toBeLessThanOrEqual(1);
});

test('full universe batches planet draw calls and reuses decoded art after navigation', async ({ page }, info) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const probe = { artLoads: 0 };
    Object.defineProperty(window, '__artProbe', { value: probe });
    const src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')!;
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      ...src,
      set(value: string) { if (value.includes('/food-planets/')) probe.artLoads++; src.set!.call(this, value); },
    });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/galaxy');
  const canvas = page.locator('canvas.galaxy-canvas');
  const ready = () => expect.poll(async () => {
    const textures = JSON.parse((await canvas.getAttribute('data-food-textures')) ?? '{}');
    return textures.total > 0 && textures.loaded === textures.total && !textures.failed;
  }).toBe(true);
  await ready();
  const artLoads = () => page.evaluate(() => (window as unknown as { __artProbe: { artLoads: number } }).__artProbe.artLoads);
  const firstLoads = await artLoads();
  expect(firstLoads).toBeGreaterThan(0);
  await page.getByRole('button', { name: '返回星系全景', exact: true }).click();
  await expect.poll(async () => Number(await canvas.getAttribute('data-rendered'))).toBeGreaterThan(100);
  const gpu = JSON.parse((await canvas.getAttribute('data-gpu'))!) as { calls: number; textures: number; geometries: number };
  await info.attach('overview-gpu.json', { body: JSON.stringify(gpu), contentType: 'application/json' });
  expect(gpu.calls, 'shared planet meshes should be rendered in batches').toBeLessThan(85);
  await page.getByRole('link', { name: '宇宙观测站', exact: true }).click();
  await expect(canvas).toHaveCount(0);
  await page.getByRole('link', { name: '营养星系', exact: true }).click();
  await ready();
  expect(await artLoads(), 'revisiting should reuse bounded decoded-image cache, with a new GPU texture per scene').toBe(firstLoads);
});
