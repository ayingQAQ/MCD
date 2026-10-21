import { expect, test } from '@playwright/test';
import snapshot from '../../public/data/nutrition.snapshot.json' with { type: 'json' };
import { datasetSchema } from '../../src/data/schema';
import { analyze } from '../../src/graph/analysis';
import { layoutGraph } from '../../src/graph/layout';
import { projectPoint, type DepthPoint, type SceneCamera } from '../../src/graph/depth';

const positions: (DepthPoint & { id: string })[] = layoutGraph(analyze(datasetSchema.parse(snapshot).foods));

test('roaming reveals planets outside the initial window and reset stays local', async ({page}, info) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/galaxy');
  const canvas=page.locator('canvas.galaxy-canvas');
  await expect(canvas).toHaveAttribute('data-window', /food-/);
  const initial=JSON.parse((await canvas.getAttribute('data-window'))!) as string[];
  const bounds=(await canvas.boundingBox())!;
  for(let step=0;step<2;step++){
    await page.mouse.move(bounds.x+750,bounds.y+bounds.height*.42);
    await page.mouse.down();
    await page.mouse.move(bounds.x+1350,bounds.y+bounds.height*.42,{steps:12});
    await page.mouse.up();
  }
  await expect.poll(async()=>{
    const next=JSON.parse((await canvas.getAttribute('data-window'))!) as string[];
    return next.some(id=>!initial.includes(id));
  }).toBe(true);
  await page.screenshot({path:info.outputPath('universe-distant-region.png'),fullPage:true});
  await page.getByRole('button',{name:'重置视图',exact:true}).click();
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-window'))!)).toEqual(initial);
  expect(initial.length).toBeLessThan(positions.length/3);
});

for (const width of [1440, 390]) for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`perspective sky retains depth through native pan and resize at ${width}px, motion ${reducedMotion}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
    await page.emulateMedia({ reducedMotion });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/galaxy');
    await expect(page.getByRole('heading', { name: '营养星系', exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const canvas = page.locator('canvas.galaxy-canvas');
    await expect(canvas).toHaveAttribute('data-scene', 'perspective');
    await expect(canvas).toHaveAttribute('data-camera', /scale/);
    await expect.poll(async () => Number(await canvas.getAttribute('data-rendered'))).toBeGreaterThan(0);
    const nearby = Number(await canvas.getAttribute('data-rendered'));
    const total = Number(await canvas.getAttribute('data-total'));
    expect(nearby, 'the home camera must show a local window, never squeeze the whole universe into view').toBeLessThan(total / 3);
    await canvas.scrollIntoViewIfNeeded();
    const bounds = (await canvas.boundingBox())!;
    const before = JSON.parse((await canvas.getAttribute('data-camera'))!) as SceneCamera;
    const imageBefore = await canvas.screenshot({ path: info.outputPath(`depth-default-${width}-${reducedMotion}.png`) });
    const anchor = await canvas.evaluate(element => {
      const rect = element.getBoundingClientRect();
      for (const fx of [.65, .8, .5]) for (const fy of [.4, .55, .3]) {
        const x = rect.left + rect.width * fx, y = rect.top + rect.height * fy;
        if (x + 65 < innerWidth && y + 25 < innerHeight && document.elementFromPoint(x, y) === element) return { x, y };
      }
      return null;
    });
    expect(anchor, 'native drag needs an uncovered point in the rendered sky').not.toBeNull();
    await page.mouse.move(anchor!.x, anchor!.y);
    await page.mouse.down();
    await page.mouse.move(anchor!.x + 65, anchor!.y + 25, { steps: 8 });
    await page.mouse.up();
    await expect.poll(async () => JSON.parse((await canvas.getAttribute('data-camera'))!).x).not.toBe(before.x);
    const after = JSON.parse((await canvas.getAttribute('data-camera'))!) as SceneCamera;
    expect(after.scale).toBe(before.scale);
    expect(new URL(page.url()).searchParams.has('focus')).toBe(false);
    const ordered = [...positions].sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));
    const displacement = (point: DepthPoint) => {
      const first = projectPoint(point, before, bounds), second = projectPoint(point, after, bounds);
      return { factor: first.factor, distance: Math.hypot(second.x - first.x, second.y - first.y) };
    };
    const first = displacement(ordered[0]), last = displacement(ordered[ordered.length - 1]);
    expect(Math.abs(first.distance - last.distance)).toBeGreaterThan(.5);
    expect(Math.sign(first.distance - last.distance)).toBe(Math.sign(first.factor - last.factor));
    await page.mouse.move(1, 1);
    const imageAfter = await canvas.screenshot({ path: info.outputPath(`depth-panned-${width}-${reducedMotion}.png`) });
    expect(imageAfter.equals(imageBefore)).toBe(false);
    await page.screenshot({ path: info.outputPath(`depth-page-${width}-${reducedMotion}.png`), fullPage: true });
    await page.setViewportSize({ width: width - 30, height: width > 1000 ? 900 : 800 });
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('data-scene', 'perspective');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`depth-resized-${width}-${reducedMotion}.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}
