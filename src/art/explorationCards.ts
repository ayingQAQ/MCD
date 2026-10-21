import type { FoodPlanet } from '../data/schema';
import { renderFoodIllustrationSvg, resolveFoodIllustration } from '../components/food-illustrations';

/** Local-only artwork export; all text is drawn as text, never interpreted as HTML. */
export async function exportExplorationCard(filename: string, title: string, lines: string[], foods: FoodPlanet[] = []) {
  await document.fonts.load('24px "ZCOOL KuaiLe"', [title,...lines,...foods.map(food=>food.name)].join(''));
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  const wrapped: string[] = [];
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('此浏览器不支持画布导出');
  ctx.font = '24px "Nunito", "ZCOOL KuaiLe", sans-serif';
  for (const line of lines) {
    let current = '';
    for (const char of line) {
      if (ctx.measureText(current + char).width > 1040) { wrapped.push(current); current = char; }
      else current += char;
    }
    wrapped.push(current);
  }
  canvas.height = Math.max(800, 340 + wrapped.length * 42);
  ctx.fillStyle = '#fff9ed'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#43394a'; ctx.lineWidth = 3; ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);
  ctx.fillStyle = '#43394a'; ctx.font = '20px "Nunito", "ZCOOL KuaiLe", sans-serif'; ctx.fillText('McCOSMOS / EXPLORATION NOTEBOOK', 70, 80);
  ctx.font = '42px "ZCOOL KuaiLe", sans-serif'; ctx.fillText(title, 70, 145);
  await Promise.all(foods.slice(0, 3).map(async (food, index) => {
    const svg = await renderFoodIllustrationSvg({foodId: resolveFoodIllustration(food).presetId, size: 110, cosmic: true});
    const url = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml;charset=utf-8'}));
    try { const img = new Image(); await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('插画导出失败')); img.src = url; }); ctx.drawImage(img, 70 + index * 150, 165, 110, 110); }
    finally { URL.revokeObjectURL(url); }
  }));
  ctx.font = '24px "Nunito", "ZCOOL KuaiLe", sans-serif';
  wrapped.forEach((line, index) => ctx.fillText(line, 70, 320 + index * 42));
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG 导出失败')), 'image/png'));
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
