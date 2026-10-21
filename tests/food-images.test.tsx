import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createFoodImageLookup, type FoodImageManifest } from '../src/data/foodImages';
import * as foodImages from '../src/data/foodImages';
import { FoodPhoto } from '../src/components/FoodPhoto';
import { readFileSync } from 'node:fs';

const source: FoodImageManifest = {
  fetchedAt: '2026-10-21T00:00:00Z', tool: 'query-meals', store: { code: 'test', name: '测试门店' },
  images: [
    { foodId: 'burger', foodName: '汉堡', menuName: '汉堡', code: '1100', url: 'https://example.com/1100.png', src: '/food-photos/1100.png', match: 'exact' },
    { foodId: 'alias', foodName: '中薯条', menuName: '薯条（中）', code: '2200', url: 'https://example.com/2200.png', src: '/food-photos/2200.png', match: 'alias', note: '人工核对规格' },
  ],
};

describe('verified product photos', () => {
  it('ships the actual image bytes for every reviewed match and labels every size reference', () => {
    const manifest = foodImages.foodImageManifest;
    for (const image of manifest.images) {
      expect(image.src).toMatch(/^\/food-photos\/[a-z0-9_-]+\.(png|gif|jpe?g|webp)$/i);
      const bytes = readFileSync(new URL(`../public${image.src}`, import.meta.url));
      expect(bytes.length).toBeGreaterThan(1000);
      expect(createFoodImageLookup(manifest)(image.foodId)).toEqual(image);
      if (image.match === 'family-reference') expect(image.referenceLabel).toMatch(/参考图/);
    }
  });
  it('uses reviewed exact and alias entries by food ID without guessing missing products', () => {
    const lookup = createFoodImageLookup(source);
    expect(lookup('burger')).toEqual(source.images[0]);
    expect(lookup('alias')).toEqual(source.images[1]);
    expect(lookup('汉堡')).toBeUndefined();
    expect(lookup('unknown-burger')).toBeUndefined();
  });

  it('rejects entries without a reviewed match or local photo source', () => {
    const lookup = createFoodImageLookup({ ...source, images: [
      { ...source.images[0], match: 'unverified' as 'exact' },
      { ...source.images[1], src: 'https://example.com/photo.png' },
    ] });
    expect(lookup('burger')).toBeUndefined();
    expect(lookup('alias')).toBeUndefined();
  });

  it('only exposes a reviewed size reference with a public reference label', () => {
    const reference = { ...source.images[0], match: 'family-reference' as const, referenceLabel: '同款中杯参考图 · 当前为大杯' };
    expect(createFoodImageLookup({ ...source, images: [reference] })('burger')).toEqual(reference);
    expect(createFoodImageLookup({ ...source, images: [{ ...reference, referenceLabel: '' }] })('burger')).toBeUndefined();
    const lookup = vi.spyOn(foodImages, 'getFoodImage').mockReturnValue(reference);
    try {
      for (const compact of [true, false]) {
        const markup = renderToStaticMarkup(<FoodPhoto food={{ id: 'burger', name: '大杯饮品' }} compact={compact}/>);
        expect(markup).toContain(reference.referenceLabel);
        expect(markup).not.toContain('暂无已核实商品图片');
      }
    } finally { lookup.mockRestore(); }
  });

  it('renders a neutral, accessible missing-photo state with no illustration', () => {
    const markup = renderToStaticMarkup(<FoodPhoto food={{ id: 'unmatched-test-food', name: '待核实餐品' }}/>);
    expect(markup).toContain('暂无已核实商品图片');
    expect(markup).toContain('待核实餐品：暂无已核实商品图片');
    expect(markup).toContain('<figure');
    expect(markup).not.toContain('<svg');
    expect(markup).not.toContain('<img');
  });

  it('labels verified aliases with their original menu name', () => {
    const lookup = vi.spyOn(foodImages, 'getFoodImage').mockReturnValue(source.images[1]);
    try {
      const markup = renderToStaticMarkup(<FoodPhoto food={{ id: 'alias', name: '中薯条' }}/>);
      expect(markup).toContain('src="/food-photos/2200.png"');
      expect(markup).toContain('alt="薯条（中）商品图片"');
      expect(markup).toContain('菜单商品图');
      expect(markup).not.toContain('人工核对规格');
      expect(markup).not.toContain('暂无已核实商品图片');
    } finally {
      lookup.mockRestore();
    }
  });

  it('keeps compact placeholders phrasing content for use inside a card button', () => {
    const markup = renderToStaticMarkup(<FoodPhoto food={{ id: 'unmatched-test-food', name: '待核实餐品' }} compact/>);
    expect(markup).toContain('food-photo-compact');
    expect(markup).not.toContain('<figure');
    expect(markup).not.toContain('<figcaption');
  });
});
