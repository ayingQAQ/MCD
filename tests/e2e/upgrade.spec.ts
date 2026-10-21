import { test, expect } from '@playwright/test';

test('five linked pages, real discovery, favorites and comparison survive navigation and reload', async ({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'宇宙观测站',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'开始探索',exact:true}).click();
  await expect(page).toHaveURL(/\/galaxy/); await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('link',{name:'星球图鉴',exact:true}).first().click();
  await page.getByLabel('图鉴搜索').fill('巨无霸');
  await page.getByRole('button',{name:'查看 巨无霸',exact:true}).click();
  await page.getByRole('button',{name:'收藏星球',exact:true}).click();
  await page.getByRole('button',{name:'加入实验室',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:/实验/})).toBeVisible();
  await page.getByRole('button',{name:'关闭星球档案',exact:true}).click();
  await page.getByLabel('图鉴搜索').fill('双层吉士汉堡');
  await page.getByRole('button',{name:'查看 双层吉士汉堡',exact:true}).click();
  await page.getByRole('button',{name:'加入实验室',exact:true}).click();
  await page.getByRole('button',{name:'关闭星球档案',exact:true}).click();
  await page.getByRole('link',{name:'营养实验室',exact:true}).first().click();
  await expect(page.getByRole('heading',{name:'营养实验室',exact:true})).toBeVisible();
  await expect(page.getByTestId('comparison-row')).toHaveCount(5);
  await expect(page.getByTestId('comparison-row').first()).toContainText('513');
  await page.reload(); await expect(page.getByTestId('comparison-row')).toHaveCount(5);
  await page.getByRole('link',{name:'在星系中查看关系',exact:true}).click();
  await expect(page).toHaveURL(/from=.+to=/); await expect(page.getByLabel('航线起点')).not.toHaveValue('');
});
