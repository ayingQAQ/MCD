import rough from 'roughjs';
import type { Drawable } from 'roughjs/bin/core';
import { stableHash, type FoodPlanet } from '../data/schema';

export const palette = { burger: '#F39A85', breakfast: '#F0CD68', side: '#99CDB4', drink: '#99CDE0', dessert: '#C6B0DF', other: '#CCC6BC' };
/** Lit and shaded tones per category, so each planet reads as a small sphere instead of a flat disc. */
export const shades: Record<keyof typeof palette, { light: string; dark: string; glow: string }> = {
  burger: { light: '#FFD3C2', dark: '#C9634F', glow: '#F39A85' },
  breakfast: { light: '#FFF0B8', dark: '#C79A2E', glow: '#F0CD68' },
  side: { light: '#D4F0E2', dark: '#5E9D80', glow: '#99CDB4' },
  drink: { light: '#D9F1FA', dark: '#5C98B0', glow: '#99CDE0' },
  dessert: { light: '#EBDDF7', dark: '#8E73B3', glow: '#C6B0DF' },
  other: { light: '#EEEAE2', dark: '#948C7E', glow: '#CCC6BC' },
};
export const ink = '#51483F';
const generator = rough.generator();
const outlines = new Map<string, Drawable>();
function drawRing(ctx: CanvasRenderingContext2D, tilt: number, front: boolean, color: string) {
  ctx.save(); ctx.rotate(tilt);
  ctx.beginPath(); ctx.ellipse(0, 0, 46, 11, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
  ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.globalAlpha = front ? .9 : .45; ctx.stroke();
  ctx.strokeStyle = ink; ctx.lineWidth = 1.3; ctx.globalAlpha = front ? 1 : .5; ctx.stroke();
  ctx.restore();
}
export function drawPlanet(ctx: CanvasRenderingContext2D, food: FoodPlanet, x: number, y: number, radius: number, selected = false) {
  const seed = stableHash(food.id), variant = seed % 5, tone = shades[food.category];
  const ringed = food.category === 'dessert' || variant === 4, tilt = -.35 + (seed % 7) * .06;
  ctx.save(); ctx.translate(x, y); ctx.scale(radius / 30, radius / 30);
  // Soft halo: a touch of atmosphere around every planet, brighter when selected.
  const halo = ctx.createRadialGradient(0, 0, 24, 0, 0, selected ? 52 : 40);
  halo.addColorStop(0, `${tone.glow}${selected ? 'AA' : '55'}`); halo.addColorStop(1, `${tone.glow}00`);
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, selected ? 52 : 40, 0, Math.PI * 2); ctx.fill();
  if (selected) {
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.strokeStyle = '#C18544'; ctx.lineWidth = 1.6; ctx.setLineDash([2, 5]); ctx.stroke(); ctx.setLineDash([]);
  }
  if (ringed) drawRing(ctx, tilt, false, tone.light);
  // Sphere body lit from the upper left.
  const body = ctx.createRadialGradient(-11, -12, 3, 2, 3, 34);
  body.addColorStop(0, tone.light); body.addColorStop(.48, palette[food.category]); body.addColorStop(1, tone.dark);
  ctx.beginPath(); ctx.ellipse(0, 0, 30, 28.5, -.1, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill();
  ctx.save(); ctx.clip();
  // Surface markings follow the sphere: curved bands, craters or swirls.
  ctx.globalAlpha = .32; ctx.fillStyle = '#FFF9E9'; ctx.strokeStyle = '#FFF9E9'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
  if (variant === 0 || food.category === 'burger') {
    for (const offset of [-14, 0, 14]) { ctx.beginPath(); ctx.moveTo(-34, offset + 4); ctx.quadraticCurveTo(0, offset - 9, 34, offset + 4); ctx.stroke(); }
  } else if (variant === 1) {
    ctx.globalAlpha = .22; ctx.fillStyle = tone.dark;
    for (const [px, py, r] of [[-10, -8, 6], [13, 5, 8], [-6, 16, 4.5], [9, -15, 3.5]]) { ctx.beginPath(); ctx.ellipse(px, py, r, r * .8, -.3, 0, Math.PI * 2); ctx.fill(); }
  } else if (variant === 2) {
    for (const px of [-16, 2, 20]) { ctx.beginPath(); ctx.ellipse(px, 0, 4, 38, -.45, 0, Math.PI * 2); ctx.fill(); }
  } else if (variant === 3) {
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(4, 4, 15, Math.PI * .9, Math.PI * 2.3); ctx.stroke();
  } else {
    ctx.lineWidth = 2;
    for (let yy = -22; yy < 28; yy += 9) { ctx.beginPath(); ctx.moveTo(-34, yy); ctx.quadraticCurveTo(0, yy + 11, 34, yy - 3); ctx.stroke(); }
  }
  // Night side: a crescent of shadow opposite the light gives volume.
  ctx.globalAlpha = 1;
  const night = ctx.createRadialGradient(-16, -18, 18, -6, -6, 46);
  night.addColorStop(0, '#3D2E2600'); night.addColorStop(.7, '#3D2E2600'); night.addColorStop(1, '#3D2E2640');
  ctx.fillStyle = night; ctx.fillRect(-32, -32, 64, 64);
  ctx.restore();
  let outline = outlines.get(food.id);
  if (!outline) { outline = generator.ellipse(0, 0, 60, 57, { seed: seed || 1, roughness: .7, stroke: ink, strokeWidth: 1.5, bowing: .3 }); outlines.set(food.id, outline); }
  rough.canvas(ctx.canvas).draw(outline);
  if (ringed) drawRing(ctx, tilt, true, tone.light);
  // Specular glint.
  ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = .75; ctx.beginPath(); ctx.ellipse(-12, -14, 5.5, 3, -.65, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = .5; ctx.beginPath(); ctx.arc(-4, -19, 1.6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  if (selected) {
    ctx.fillStyle = ink;
    for (const eye of [-7, 7]) { ctx.beginPath(); ctx.arc(eye, 2, 1.8, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, 4, 4, .15, Math.PI - .15); ctx.strokeStyle = ink; ctx.lineWidth = 1.4; ctx.stroke();
  }
  ctx.restore();
}
