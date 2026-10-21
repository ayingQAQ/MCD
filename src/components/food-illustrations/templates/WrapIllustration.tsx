import { illustrationPalette as p } from '../palette';
import { Outline, SketchLine } from '../primitives/Outline';
import { Highlight, Shadow } from '../primitives/Light';
import { Face } from '../primitives/Face';
import type { DrawingContext } from '../types';
export function Wrap({ closed, detail }: { closed: boolean; detail: DrawingContext['detail'] }) { return <g>
  <Outline d={closed ? 'M36 56q19-20 44-21l40 23-3 57q-9 28-39 30-30-4-36-31Z' : 'M43 49q35-18 75 2l-4 62q-6 29-34 32-31-4-37-35Z'} fill={p.wrapper}/>
  <Shadow d="m103 68 15-17-4 62q-6 29-34 32l-8-9Z" color={p.bunLight}/>
  <path d={closed ? 'm37 57 44 56 38-54M43 101l35 43 34-44' : 'M44 64q19 36 64 53M46 104l34 40 33-42'} fill="none" stroke={p.outlineSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  {!closed && <><Outline d="M42 49q33-28 76 0-2 28-36 28-37-1-40-28Z" fill={p.cream} strokeWidth={2.7}/><path d="m49 47 5-9 8 4 7-7 10 8 9-5 8 8 12-1 5 9-13 9-37-1Z" fill={p.lettuce} stroke={p.lettuceShadow} strokeWidth="1.5"/><path d="m59 53 16-4 8 10-16 7ZM88 47l17 5-4 13-15-5Z" fill={p.chicken} stroke={p.outlineSoft} strokeWidth="1.5"/></>}
  <Highlight d="m49 81 5 8 2 18-4-5Z"/>{detail === 'full' && <SketchLine d="m57 114 4 3m14 9 4 1m9-39 5 3m-39-21 4 2" color={p.bunDark} seed={89}/>}</g>; }
export function WrapIllustration({ preset, detail, expression }: DrawingContext) { return <g data-food-body="wrap" transform={preset.variant === 'closed' ? 'rotate(-8 80 90)' : 'rotate(7 80 90)'}><Wrap closed={preset.variant === 'closed'} detail={detail}/><Face expression={expression} x={80} y={preset.variant === 'closed' ? 83 : 101} scale={.68}/></g>; }
