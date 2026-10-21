import type { DrawingContext, IngredientLayer } from '../types';
import { BottomBun, TopBun } from '../ingredients/Bun';
import { IngredientLayerArt, layerHeights } from '../ingredients/Layers';
import { Face } from '../primitives/Face';
export function BurgerIllustration({ preset, detail, expression }: DrawingContext) {
  const layers: readonly IngredientLayer[] = preset.layers ?? (preset.ingredients ?? ['sauce', 'beef']).map(kind => ({ kind }));
  const height = (layer: typeof layers[number]) => layer.thickness ?? layerHeights[layer.kind];
  const total = layers.reduce((sum, layer) => sum + height(layer), 0);
  let y = 124 - total;
  const bunY = y - 37, wide = preset.bun === 'long';
  return <g transform={wide ? 'translate(13 0) scale(1.22 1)' : 'translate(25 0)'} data-food-body="burger">
    <g transform="translate(0 124)"><BottomBun/></g>
    {layers.map((layer, i) => { const top = y; const h = height(layer); y += h; return <g key={i} transform={`translate(${layer.offsetX ?? (i % 2 ? -1.5 : 1)} ${top}) scale(1 ${h / layerHeights[layer.kind]})`}><IngredientLayerArt kind={layer.kind} detail={detail}/></g>; })}
    <g transform={`translate(0 ${bunY})`}><TopBun shape={preset.bun} detail={detail} seed={preset.layoutSeed}/></g>
    <Face expression={expression} x={56 + preset.layoutSeed % 3} y={bunY + (preset.bun === 'flat' ? 23 : 24)} scale={.69}/>
  </g>;
}
