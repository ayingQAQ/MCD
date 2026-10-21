import rough from 'roughjs';
import type { Drawable } from 'roughjs/bin/core';
import { stableHash, type FoodPlanet } from '../data/schema';

export const palette = { burger: '#F39A85', breakfast: '#F0CD68', side: '#99CDB4', drink: '#99CDE0', dessert: '#C6B0DF', other: '#CCC6BC' };
export const ink = '#51483F';
const generator = rough.generator();
const outlines = new Map<string, Drawable>();
export function drawPlanet(ctx: CanvasRenderingContext2D, food: FoodPlanet, x: number, y: number, radius: number, selected = false) {
  const seed = stableHash(food.id), variant = seed % 5;
  ctx.save(); ctx.translate(x, y); ctx.scale(radius / 30, radius / 30);
  if (selected) {
    ctx.beginPath(); ctx.arc(0, 0, 37, 0, Math.PI * 2); ctx.fillStyle = '#FFF4C4'; ctx.fill();
    ctx.strokeStyle = '#C18544'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 4]); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.beginPath(); ctx.ellipse(1, 4, 30, 29, -.1, 0, Math.PI * 2); ctx.fillStyle = '#6C534626'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, 30, 28, -.1, 0, Math.PI * 2); ctx.fillStyle = palette[food.category]; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.globalAlpha = .45; ctx.fillStyle = '#FFF9E9'; ctx.strokeStyle = '#FFF9E9'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  if (variant === 0 || food.category === 'burger') {
    for (const offset of [-15, 0, 15]) { ctx.beginPath(); ctx.moveTo(-35, offset); ctx.bezierCurveTo(-10, offset - 8, 10, offset + 8, 35, offset); ctx.stroke(); }
  } else if (variant === 1) {
    for (const [px, py, r] of [[-11, -10, 9], [17, 6, 11], [-8, 19, 6]]) { ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill(); }
  } else if (variant === 2) {
    for (const px of [-20, 0, 20]) { ctx.beginPath(); ctx.ellipse(px, -3, 5, 40, -.5, 0, Math.PI * 2); ctx.fill(); }
  } else if (variant === 3) {
    ctx.beginPath(); ctx.arc(-15, -15, 27, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = palette[food.category]; ctx.beginPath(); ctx.arc(-3, -23, 25, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.lineWidth = 2;
    for (let yy = -25; yy < 30; yy += 10) { ctx.beginPath(); ctx.moveTo(-35, yy); ctx.quadraticCurveTo(0, yy + 15, 35, yy - 5); ctx.stroke(); }
  }
  ctx.restore();
  const cacheKey = food.id;
  let outline = outlines.get(cacheKey);
  if (!outline) { outline = generator.ellipse(0, 0, 60, 56, { seed: seed || 1, roughness: .8, stroke: ink, strokeWidth: 1.6, bowing: .4 }); outlines.set(cacheKey, outline); }
  rough.canvas(ctx.canvas).draw(outline);
  if (food.category === 'dessert' || variant === 4) {
    ctx.save(); ctx.rotate(-.35); ctx.beginPath(); ctx.ellipse(0, 1, 43, 10, 0, 0, Math.PI); ctx.strokeStyle = ink; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore();
  }
  ctx.fillStyle = '#FFF9E9'; ctx.globalAlpha = .6; ctx.beginPath(); ctx.ellipse(-12, -15, 5, 2.7, -.6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  if (selected) {
    ctx.fillStyle = ink;
    for (const eye of [-7, 7]) { ctx.beginPath(); ctx.arc(eye, 2, 1.7, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, 4, 4, .15, Math.PI - .15); ctx.strokeStyle = ink; ctx.lineWidth = 1.4; ctx.stroke();
  }
  ctx.restore();
}
