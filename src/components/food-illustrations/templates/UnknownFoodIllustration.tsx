import { illustrationPalette as p } from '../palette';
import { Outline, SketchLine } from '../primitives/Outline';
import { Face } from '../primitives/Face';
import { Highlight, Shadow } from '../primitives/Light';
import type { DrawingContext } from '../types';
export function UnknownFoodIllustration({ detail, expression }: DrawingContext) { return <g data-food-body="unknown">
  <Outline d="m43 36 10-5 12 5 12-5 13 5 12-5 13 6 6 100q-42 13-82 0Z" fill={p.wrapper}/><Shadow d="m103 35 12 2 6 100-17 4-5-17Z" color={p.bunLight}/><path d="m43 49 69 1M39 136l15-13 51 1 16 13" fill="none" stroke={p.outlineSoft} strokeWidth="2" strokeLinecap="round"/>
  <Outline d="m56 67 45-1 1 39-44 2Z" fill={p.cream} strokeWidth={1.8}/>{expression === 'neutral' ? <path d="M72 78q1-7 8-6 14 3 3 13l-4 3v5m0 5v1" fill="none" stroke={p.outlineSoft} strokeWidth="2.5" strokeLinecap="round"/> : <Face expression={expression} x={80} y={83} scale={.7}/>}
  <Highlight d="m48 56 4 1-1 62-5 3Z" opacity={.5}/>{detail === 'full' && <SketchLine d="m60 116 29-1" seed={92}/>}</g>; }
