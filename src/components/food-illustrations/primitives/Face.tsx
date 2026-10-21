import { illustrationPalette as p } from '../palette';
import type { Expression } from '../types';
export function Face({ expression, x = 0, y = 0, scale = 1 }: { expression: Expression; x?: number; y?: number; scale?: number }) {
  if (expression === 'neutral') return null;
  const sleepy = expression === 'sleepy', smile = expression === 'smile', excited = expression === 'excited';
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-expression={expression} fill={p.outline} stroke={p.outline} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {sleepy ? <path d="M-13 0q4 4 8 0M5 1q4 4 8 0" fill="none"/> : smile || excited ? <path d={excited ? 'm-13 2 4-5 4 5m10 0 4-5 4 5' : 'M-13 2q4-7 8 0M5 2q4-7 8 0'} fill="none"/> : <><ellipse cx={expression === 'shy' ? -8 : -9} cy="0" rx="1.8" ry="2.5" stroke="none"/><ellipse cx={expression === 'shy' ? 9 : 10} cy={expression === 'curious' ? -1 : 0} rx="1.8" ry="2.5" stroke="none"/>{expression === 'curious' && <path d="m6-8 6-2" fill="none" strokeWidth="1.4"/>}</>}
    {expression === 'curious' ? <ellipse cx="1" cy="8" rx="2.3" ry="3" fill="none"/> : sleepy ? <path d="M-2 9q3-2 5 0" fill="none"/> : excited ? <><path d="M-5 7q6 15 12 0Z" fill={p.outline}/><path d="M-1 12q4-2 6 0" stroke={p.pink}/></> : <path d={expression === 'shy' ? 'M-3 8q4 4 7 0' : 'M-5 7q6 8 12-1'} fill="none"/>}
    {(expression === 'shy' || expression === 'happy') && <g fill={p.pink} stroke="none" opacity=".7"><ellipse cx="-18" cy="6" rx="4" ry="2.3"/><ellipse cx="19" cy="6" rx="4" ry="2.3"/></g>}
  </g>;
}
