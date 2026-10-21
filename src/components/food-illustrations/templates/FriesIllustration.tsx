import { illustrationPalette as p } from '../palette';
import { Outline, SketchLine } from '../primitives/Outline';
import { Face } from '../primitives/Face';
import { Highlight, Shadow } from '../primitives/Light';
import type { DrawingContext, Expression } from '../types';
export function FriesStick({ x, y, length, angle }: { x: number; y: number; length: number; angle: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle})`}><Outline d={`M0 1q4-2 9 0l1 ${length - 3}-8 3Z`} fill={p.fries} strokeWidth={2.2}/><path d={`M3 5 4 ${length - 5}`} stroke={p.cream} strokeWidth="2" strokeLinecap="round"/><path d={`m8 4 1 ${length - 6}`} stroke={p.friesShadow} strokeWidth="2"/></g>;
}
export function FriesCluster({ count = 12, seed = 7 }: { count?: number; seed?: number }) {
  const sticks = [[76, 28, 65, -4], [57, 36, 62, -11], [95, 32, 68, 9], [39, 48, 55, -17], [111, 43, 63, 17], [67, 43, 56, 3], [86, 41, 62, -5], [49, 27, 72, -5], [103, 26, 74, 14], [33, 62, 45, -22], [120, 61, 48, 19], [61, 22, 78, 1], [81, 22, 76, 6], [91, 53, 53, 3], [53, 54, 54, -9]];
  return <g data-fries-count={count}>{sticks.slice(0, count).map(([x, y, length, angle], i) => <FriesStick key={i} x={x} y={y + (seed + i) % 3} length={length} angle={angle}/>)}</g>;
}
export function FriesBox() { return <g><Outline d="M30 79Q79 99 130 78l-13 57q-34 14-73 0Z" fill={p.red}/><Shadow d="m115 85 15-7-13 57q-8 4-17 5Z" color={p.redShadow}/><Highlight d="m39 91 6 3 7 34-5-1Z" opacity={.55}/><SketchLine d="M42 134q34 9 66-1" color={p.redShadow} seed={26}/></g>; }
export function FriesFace({ expression }: { expression: Expression }) { return <Face expression={expression} x={80} y={113} scale={.9}/>; }
export function SaltDecoration() { return <g fill={p.cream}><path d="m42 51 2-1 1 3-2 1ZM77 38l2 1-1 2-2-1ZM107 60l2-1 2 2-2 2Z"/></g>; }
export function FriesIllustration({ preset, expression, detail }: DrawingContext) {
  const small = preset.variant === 'small', large = preset.variant === 'large';
  return <g data-food-body="fries" transform={small ? 'translate(14 22) scale(.83)' : large ? 'translate(-5 -12) scale(1.08)' : undefined}><FriesCluster count={small ? 7 : large ? 15 : 11} seed={preset.layoutSeed}/><FriesBox/><FriesFace expression={expression}/>{detail === 'full' && <SaltDecoration/>}</g>;
}
