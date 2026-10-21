import {expect,test} from '@playwright/test';

test('unmount releases the real WebGL context; reopening creates a healthy scene',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/galaxy');
  const canvas=page.locator('canvas.galaxy-canvas');
  await expect(canvas).toHaveAttribute('data-gpu',/geometries/);
  const handle=(await canvas.elementHandle())!;
  const original=JSON.parse((await canvas.getAttribute('data-gpu'))!) as {geometries:number;textures:number};
  await page.getByRole('link',{name:'宇宙观测站',exact:true}).click();
  await expect(canvas).toHaveCount(0);
  await expect.poll(()=>handle.evaluate(element=>(element as HTMLCanvasElement).getContext('webgl2')!.isContextLost())).toBe(true);
  await page.getByRole('link',{name:'营养星系',exact:true}).click();
  await expect(canvas).toHaveAttribute('data-gpu',/geometries/);
  expect(await canvas.evaluate(element=>(element as HTMLCanvasElement).getContext('webgl2')!.isContextLost())).toBe(false);
  const current=JSON.parse((await canvas.getAttribute('data-gpu'))!) as {geometries:number;textures:number};
  expect(current.geometries).toBeLessThanOrEqual(original.geometries+1);
  expect(current.textures).toBeLessThanOrEqual(original.textures+1);
  await handle.dispose();
});

test('unsupported WebGL is explicit and preserves HTML food exploration',async({page})=>{
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]){
      if(type==='webgl2'||type==='webgl')return null;
      return Reflect.apply(original,this,[type,...args]);
    } as typeof original;
  });
  await page.goto('/galaxy');
  await expect(page.locator('.webgl-error')).toContainText('WebGL2');
  await expect(page.locator('canvas.galaxy-canvas')).not.toHaveAttribute('data-camera',/position/);
  await page.getByLabel('搜索餐品',{exact:true}).fill('巨无霸');
  await page.getByRole('button',{name:'探索 巨无霸',exact:true}).click();
  await expect(page.getByRole('heading',{name:'巨无霸',exact:true})).toBeVisible();
  await expect(page.getByText('513 kcal',{exact:true}).first()).toBeVisible();
});
