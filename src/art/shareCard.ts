import { drawPlanet, ink } from './planets';
import { formatNutrient, nutrientKeys, nutrientNames, type Dataset, type FoodPlanet } from '../data/schema';

export async function exportPlanetCard(food: FoodPlanet, dataset: Dataset): Promise<void> {
  await document.fonts.ready;
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器不支持图片导出');
  ctx.fillStyle = '#FFF9ED'; ctx.fillRect(0, 0, 1080, 1350);
  ctx.strokeStyle = '#D9C8B6'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.strokeRect(40, 40, 1000, 1270); ctx.setLineDash([]);
  ctx.fillStyle = ink; ctx.font = '600 30px "Nunito", sans-serif'; ctx.fillText('McCosmos / 麦门星图', 85, 115);
  ctx.font = '23px "Nunito", sans-serif'; ctx.fillStyle = '#887A67'; ctx.fillText('A LITTLE FOOD UNIVERSE · 星球观察笔记', 85, 158);
  drawPlanet(ctx, food, 540, 385, 145, true);
  ctx.fillStyle = ink; ctx.font = '44px "ZCOOL KuaiLe", "Microsoft YaHei", sans-serif';
  const lines: string[] = []; let line = '';
  for (const char of food.name) { if (ctx.measureText(line + char).width > 850) { lines.push(line); line = char; } else line += char; } if (line) lines.push(line);
  ctx.textAlign = 'center'; lines.slice(0, 3).forEach((text, i) => ctx.fillText(text, 540, 610 + i * 54));
  ctx.textAlign = 'left'; let y = 680 + Math.min(2, lines.length - 1) * 54;
  for (const key of nutrientKeys) {
    ctx.font = '27px "Nunito", "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#887A67'; ctx.fillText(nutrientNames[key], 135, y);
    ctx.textAlign = 'right'; ctx.fillStyle = ink; ctx.font = '600 29px "Nunito", "Microsoft YaHei", sans-serif'; ctx.fillText(formatNutrient(food, key), 940, y); ctx.textAlign = 'left'; y += 64;
  }
  ctx.font = '22px "Nunito", "Microsoft YaHei", sans-serif'; ctx.fillStyle = '#887A67';
  const official = dataset.meta.mode === 'official-snapshot';
  ctx.fillText(official ? `来源：麦当劳 MCP 营养快照 · ${dataset.meta.fetchedAt?.slice(0, 10)}` : '合成示例数据 · 非官方营养信息', 85, 1170);
  ctx.fillText(food.basis.unitsVerified ? food.basis.description : '接口未声明计量基准及部分单位；原始值不代表每 100 克。', 85, 1215);
  ctx.fillText('独立开发的参赛作品，非麦当劳官方产品。信息以官方渠道为准。', 85, 1260);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('图片导出失败')), 'image/png'));
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `McCosmos-${food.id}.png`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
