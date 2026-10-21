import { useId } from 'react';
import type { FoodIllustrationProps, DrawingContext } from './types';
import { getFoodIllustrationPreset } from './registry';
import { GroundShadow } from './primitives/Light';
import { CosmicDecoration } from './primitives/CosmicDecoration';
import { BurgerIllustration } from './templates/BurgerIllustration';
import { FriesIllustration } from './templates/FriesIllustration';
import { DrinkIllustration } from './templates/DrinkIllustration';
import { NuggetIllustration } from './templates/NuggetIllustration';
import { DessertIllustration } from './templates/DessertIllustration';
import { BreakfastIllustration } from './templates/BreakfastIllustration';
import { WrapIllustration } from './templates/WrapIllustration';
import { UnknownFoodIllustration } from './templates/UnknownFoodIllustration';

const templates = { burger: BurgerIllustration, fries: FriesIllustration, drink: DrinkIllustration, nugget: NuggetIllustration, dessert: DessertIllustration, breakfast: BreakfastIllustration, wrap: WrapIllustration, unknown: UnknownFoodIllustration };
export function FoodIllustration({ foodId, preset: suppliedPreset, size = 160, expression: override, cosmic = false, animated = false, className, title, 'aria-label': ariaLabel, decorative = false }: FoodIllustrationProps) {
  const instanceId = `mc-food-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const preset = suppliedPreset ?? getFoodIllustrationPreset(foodId);
  if (!Number.isFinite(size) || size <= 0) throw new RangeError('Illustration size must be positive and finite');
  if (!templates[preset.family]) throw new TypeError('Unknown illustration family');
  if (Object.values(preset.colors ?? {}).some(value => !/^#[0-9a-f]{6}$/i.test(value))) throw new TypeError('Illustration colors must be solid six-digit hex values');
  const detail = size <= 64 ? 'compact' : size < 128 ? 'standard' : 'full';
  const context: DrawingContext = { preset, detail, expression: override ?? preset.expression ?? 'neutral' };
  const Template = templates[preset.family];
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width={size} height={size} className={className} role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : ariaLabel} aria-labelledby={decorative || ariaLabel ? undefined : `${instanceId}-title`} focusable="false" data-family={preset.family} data-preset={preset.id} data-detail={detail} data-mapping={preset.mapping} data-mc-animated={animated ? 'true' : undefined}>
    {!decorative && <><title id={`${instanceId}-title`}>{title ?? `${preset.name} · 通用食物示意插画`}</title><desc>原创SVG食物插画。通用示例，不代表具体商品配方或官方包装。</desc></>}
    {animated && <style>{'@keyframes mcFoodFloat{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-2px) rotate(-.6deg)}}[data-mc-animated="true"]>.mc-food-motion{animation:mcFoodFloat 5.2s ease-in-out infinite;transform-origin:80px 95px}@media(prefers-reduced-motion:reduce){[data-mc-animated="true"]>.mc-food-motion{animation:none}}'}</style>}
    <GroundShadow wide={preset.family === 'burger' || preset.family === 'dessert'}/>
    <g className="mc-food-motion">{cosmic && <CosmicDecoration decorations={preset.decorations ?? ['orbit']} layer="back"/>}<Template {...context}/>{cosmic && <CosmicDecoration decorations={preset.decorations ?? ['orbit']} layer="front"/>}</g>
  </svg>;
}
