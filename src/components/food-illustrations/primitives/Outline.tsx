import type { SVGProps } from 'react';
import rough from 'roughjs';
import { illustrationPalette as p } from '../palette';
const generator = rough.generator();
const cache = new Map<string, ReturnType<typeof generator.toPaths>>();
export function Outline({ d, fill = p.cream, stroke = p.outline, strokeWidth = 3.2, ...props }: SVGProps<SVGPathElement>) {
  return <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}/>;
}
/** Low-roughness, fixed-seed line work inspired by Rough.js/Wired; not noisy outlines. */
export function SketchLine({ d, seed = 97, color = p.outlineSoft, width = 1.6 }: { d: string; seed?: number; color?: string; width?: number }) {
  const key = `${d}|${seed}|${color}|${width}`;
  let paths = cache.get(key);
  if (!paths) { paths = generator.toPaths(generator.path(d, { seed: seed || 97, roughness: .35, bowing: .3, stroke: color, strokeWidth: width, disableMultiStroke: true, preserveVertices: true })); cache.set(key, paths); }
  return <g aria-hidden="true">{paths.map((path, i) => <path key={i} d={path.d} fill="none" stroke={path.stroke} strokeWidth={path.strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>)}</g>;
}
