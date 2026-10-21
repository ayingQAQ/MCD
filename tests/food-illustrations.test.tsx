import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FoodIllustration } from '../src/components/food-illustrations/FoodIllustration';
import { foodPresets } from '../src/components/food-illustrations/presets/foods';
import { resolveFoodIllustration } from '../src/components/food-illustrations/registry';
import { renderFoodIllustrationSvg } from '../src/components/food-illustrations/exportSvg';
import type { Expression } from '../src/components/food-illustrations/types';

const draw = (foodId: string, extra = {}) => renderToStaticMarkup(createElement(FoodIllustration, { foodId, ...extra }));
describe('original food illustration system', () => {
  it('provides at least twenty configurations covering eight structural families', () => {
    expect(foodPresets.length).toBeGreaterThanOrEqual(20);
    expect(new Set(foodPresets.map(p => p.id)).size).toBe(foodPresets.length);
    expect(new Set(foodPresets.map(p => p.family)).size).toBe(8);
    expect(foodPresets.every(p => p.mapping === 'generic-example')).toBe(true);
  });
  it('is deterministic and structurally differentiated even without colors, titles, or faces', () => {
    const structures = foodPresets.map(p => {
      const markup = draw(p.id, { expression: 'neutral' });
      expect(markup).toBe(draw(p.id, { expression: 'neutral' }));
      return [...markup.matchAll(/ d="([^"]+)"/g)].map(match => match[1]).join('|') + [...markup.matchAll(/ transform="([^"]+)"/g)].map(match => match[1]).join('|');
    });
    expect(new Set(structures).size).toBeGreaterThanOrEqual(20);
  });
  it('preserves the food body while adding opt-in cosmic decoration and local animation', () => {
    const plain = draw('burger-double');
    const cosmic = draw('burger-double', { cosmic: true, animated: true });
    expect(plain).toContain('data-food-body');
    expect(plain).not.toContain('data-cosmic');
    expect(cosmic).toContain('data-cosmic');
    expect(cosmic).toContain('prefers-reduced-motion');
    expect(draw('burger-double', { animated: false })).not.toContain('@keyframes');
  });
  it('simplifies fine texture at small sizes, without losing the silhouette', () => {
    const small = draw('burger-double', { size: 48 });
    const large = draw('burger-double', { size: 256 });
    expect(small).toContain('viewBox="0 0 160 160"');
    expect(small).toContain('width="48"');
    expect(small.length).toBeLessThan(large.length);
    expect(small).toContain('data-ingredient="beef"');
  });
  it('supports accessible titles, all seven expressions and safe unknown fallback', () => {
    for (const expression of ['happy', 'smile', 'curious', 'sleepy', 'excited', 'shy', 'neutral'] as Expression[]) {
      expect(draw('fries-regular', { expression, title: '食物 <安全> & 示例' })).toContain('食物 &lt;安全&gt; &amp; 示例');
    }
    expect(draw('not-a-verified-product')).toContain('data-family="unknown"');
    expect(draw('fries-regular', { decorative: true })).toContain('aria-hidden="true"');
  });
  it('does not infer ingredients from nutrition or claim category examples as real recipes', () => {
    expect(resolveFoodIllustration({ name: '没有确认的餐品' })).toMatchObject({ presetId: 'unknown-bag', reason: 'unknown', status: 'generic-example' });
    expect(resolveFoodIllustration({ name: '中薯条', category: 'side' })).toMatchObject({ presetId: 'fries-regular', reason: 'name-shape' });
    expect(resolveFoodIllustration({ name: '大薯条' }).presetId).toBe('fries-large');
    expect(resolveFoodIllustration({ name: '巨无霸', category: 'burger' }).status).toBe('generic-example');
    expect(resolveFoodIllustration({ name: '不认识的带骨鸡翅', category: 'side' }).presetId).toBe('unknown-bag');
    expect(resolveFoodIllustration({ name: '朱古力新地', category: 'dessert' }).presetId).toBe('dessert-plain-cup');
    expect(resolveFoodIllustration({ name: '鲜蔬蛋沙拉卷' }).presetId).toBe('wrap-closed');
    expect(resolveFoodIllustration({ name: '板烧鸡腿堡', category: 'burger' }).presetId).toBe('unknown-bag');
    expect(resolveFoodIllustration({ name: '香脆鸡腿堡', category: 'burger' }).presetId).toBe('burger-crispy');
    expect(resolveFoodIllustration({ name: '麦香鱼', category: 'burger' }).presetId).toBe('unknown-bag');
    expect(resolveFoodIllustration({ name: '麦香鸡', category: 'burger' }).presetId).toBe('unknown-bag');
  });
  it('exports self-contained, static, transparent SVG for every preset', async () => {
    for (const preset of foodPresets) {
      const svg = await renderFoodIllustrationSvg({ foodId: preset.id, size: 160, cosmic: true, animated: true });
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('width="160"');
      expect(svg).not.toMatch(/<image|<script|<foreignObject|<link|@import|@font-face|<filter|@keyframes/);
      expect(svg).not.toMatch(/(?:href|src)="https?:|url\(https?:/);
    }
  });
});
