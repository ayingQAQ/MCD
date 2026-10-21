import { expect, test } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`local brand assets and page layouts work at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const external: string[] = [], errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    // Logos and all visual assets must remain available without third-party hosts.
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (!['localhost', '127.0.0.1'].includes(url.hostname)) { external.push(url.href); return route.abort(); }
      return route.continue();
    });
    for (const path of ['/', '/galaxy', '/atlas', '/lab', '/quests']) {
      await page.goto(path);
      const logo = page.locator('.site-header .mc-brand-mark');
      await expect(logo).toBeVisible();
      await expect.poll(() => logo.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      if (path === '/') {
        await expect(page.locator('.mc-delivery-satellite')).toBeVisible();
        const svgLogo = await page.request.get('/brand/mcdonalds-logo.jpg');
        expect(svgLogo.ok()).toBe(true);
        expect(svgLogo.headers()['content-type']).toContain('image/jpeg');
      }
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath(`brand-${path.slice(1) || 'home'}-${width}.png`), fullPage: true });
    }
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
  });
}
