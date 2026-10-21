import { illustrationPalette as p } from '../palette';
import { Outline, SketchLine } from './Outline';
import type { Decoration } from '../types';
const star = 'M0-7 2-2 7-1 3 2 4 7-1 4-6 6-4 1-7-3-2-3Z';
export function CosmicDecoration({ decorations, layer }: { decorations: readonly Decoration[]; layer: 'back' | 'front' }) {
  return <g data-cosmic={layer}>
    {layer === 'back' && decorations.includes('orbit') && <SketchLine d="M14 105C-1 79 145 53 149 83c6 23-112 65-135 34" color={p.blueShadow} seed={27} width={1.7}/>}
    {layer === 'front' && decorations.includes('satellite') && <g><path d="m131 35 10-5" stroke={p.outlineSoft} strokeWidth="1.5"/><Outline d="M133 25q8-9 14 1 4 10-6 12-11 1-8-13Z" fill={p.purple} strokeWidth="2"/><path d="m135 27 8-2" stroke={p.cream} strokeWidth="2" strokeLinecap="round"/></g>}
    {layer === 'front' && decorations.includes('star-pin') && <g transform="translate(24 29) rotate(-12)"><Outline d={star} fill={p.cheese} strokeWidth="1.8"/></g>}
    {layer === 'back' && decorations.includes('flag') && <g><path d="m129 48 4-29" stroke={p.outline} strokeWidth="2.1" strokeLinecap="round"/><Outline d="m133 20 17 7-18 6Z" fill={p.purple} strokeWidth="1.8"/></g>}
  </g>;
}
