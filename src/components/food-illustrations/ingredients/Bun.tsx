import { illustrationPalette as p } from '../palette';
import { Outline, SketchLine } from '../primitives/Outline';
import { Highlight, Shadow } from '../primitives/Light';
import type { DetailLevel } from '../types';
export function SesameSeeds({ count = 8, seed = 1 }: { count?: number; seed?: number }) {
  const seeds = [[19, 21, -32], [34, 11, 16], [54, 19, -17], [72, 9, 30], [89, 22, -29], [39, 28, -42], [74, 29, 20], [55, 7, -12], [14, 30, 28], [96, 30, -15]];
  return <g fill={p.cream} stroke={p.bunDark} strokeWidth=".7">{seeds.slice(0, Math.max(0, Math.min(10, count))).map(([x, y, angle], i) => <ellipse key={i} cx={x + (seed + i) % 3 - 1} cy={y} rx="2.7" ry="1.1" transform={`rotate(${angle} ${x} ${y})`}/>)}</g>;
}
export function TopBun({ shape = 'domed', detail = 'full', seed = 1 }: { shape?: 'domed' | 'flat' | 'long'; detail?: DetailLevel; seed?: number }) {
  const d = shape === 'flat' ? 'M1 33C-1 16 17 8 51 7c31-2 55 7 59 22 2 8-15 12-51 11C24 42 4 40 1 33Z' : shape === 'long' ? 'M0 31C4 14 24 7 60 9c31 1 48 8 51 22 2 8-19 10-55 9C20 42-2 40 0 31Z' : 'M1 33C4 13 24 0 53 1c27-1 50 10 56 28 6 12-13 14-54 13C21 43-2 43 1 33Z';
  return <g data-ingredient="top-bun"><Outline d={d} fill={p.bunLight}/><Shadow d="M2 31q52 13 108-1 4 12-55 12Q3 44 2 31Z" color={p.bunDark}/><Highlight d="M14 24C23 12 35 9 43 11c4 4-20 7-25 16Z"/>{detail !== 'compact' && <SesameSeeds count={detail === 'full' ? 6 + seed % 5 : 4} seed={seed}/>}</g>;
}
export function BottomBun() { return <g data-ingredient="bottom-bun"><Outline d="M1 0q53-6 108 0 4 17-47 19C17 22-2 14 1 0Z" fill={p.bunLight}/><Shadow d="M4 9q56 12 101-1-8 12-50 11Q18 18 4 9Z" color={p.bunDark}/><SketchLine d="M12 4q39 5 84-1" color={p.bunInside} width={2} seed={18}/></g>; }
