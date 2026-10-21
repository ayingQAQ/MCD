import { illustrationPalette as p } from '../palette';
import { Outline, SketchLine } from '../primitives/Outline';
import { Highlight, Shadow } from '../primitives/Light';
import { Face } from '../primitives/Face';
import type { DrawingContext, Expression } from '../types';
export function Nugget({ variant = 0, detail = 'full', expression = 'neutral' }: { variant?: number; detail?: DrawingContext['detail']; expression?: Expression }) {
  const outlines = ['M2 20C-3 7 12-1 23 2s19-7 26 6c8 11 1 29-12 31S4 36 2 20Z', 'M3 13C4 2 15-1 23 5c10-6 22-2 25 9 6 9 3 22-10 23L14 39C1 37-3 22 3 13Z', 'M0 20C0 7 8 1 19 2c7 2 7 9 13 10s16-3 19 10c4 14-9 19-20 16-6-3-9-1-17 1S-1 32 0 20Z'];
  return <g><Outline d={outlines[variant % 3]} fill={p.chicken} strokeWidth={2.7}/><Shadow d="M5 27q19 13 42-2-2 13-21 13Q10 38 5 27Z" color={p.bunDark}/><Highlight d="M9 14q6-8 14-5l-1 4-9 4Z" opacity={.65}/>{detail !== 'compact' && <SketchLine d="m9 24 2-2m17-5 3-1m6 9 2-2m-20 6 3 1" seed={61} width={1.4}/>}<Face expression={expression} x={25} y={20} scale={.45}/></g>;
}
export function SnackBox({ front = false }: { front?: boolean }) { return front ? <g><Outline d="M22 100q57 9 112-2l-7 39q-51 13-97-1Z" fill={p.cream}/><path d="m30 111 3 17q46 10 90 0" fill="none" stroke={p.bunDark} strokeWidth="2"/><SketchLine d="m51 121 15 1m8 0 30-1" seed={66}/></g> : <g><Outline d="M23 87 32 54l101-2 9 41-14 15-96-1Z" fill={p.wrapper}/><path d="m34 64 94-2 5 29-104 3Z" fill={p.cream}/></g>; }
export function SnackBag() { return <g><Outline d="m35 76 8 5 10-5 9 5 11-5 10 5 12-5 9 4 12-6 10 62q-42 15-87 1Z" fill={p.wrapper}/><path d="m109 81 6 49-13 5" fill="none" stroke={p.bunDark} strokeWidth="3"/><SketchLine d="m47 111 45 1m-42 8 39 2" seed={65}/></g>; }
export function SauceCup() { return <g transform="translate(116 112)"><Outline d="M0 5q16-7 31-1l-4 24q-12 7-24-1Z" fill={p.white} strokeWidth={2.2}/><Outline d="M0 5q16-9 31-1 0 12-17 12Q0 15 0 5Z" fill={p.chocolate} strokeWidth={2}/><path d="m7 5 7-1" stroke={p.bunInside} strokeWidth="2" strokeLinecap="round"/></g>; }
export function NuggetGroup({ detail, expression, bag = false }: { detail: DrawingContext['detail']; expression: Expression; bag?: boolean }) { return <g><g transform="translate(29 55) rotate(-16 25 20)"><Nugget variant={0} detail={detail}/></g><g transform="translate(80 51) rotate(13 25 20)"><Nugget variant={1} detail={detail}/></g><g transform={bag ? 'translate(55 42) rotate(-3 25 20)' : 'translate(54 79) rotate(8 25 20)'}><Nugget variant={2} detail={detail} expression={expression}/></g></g>; }
export function NuggetIllustration({ preset, expression, detail }: DrawingContext) {
  if (preset.variant === 'single') return <g data-food-body="nugget"><g transform="translate(35 52) scale(1.7)"><Nugget variant={2} detail={detail} expression={expression}/></g></g>;
  const bag = preset.variant === 'bag';
  return <g data-food-body="nugget">{!bag && <SnackBox/>}<NuggetGroup detail={detail} expression={expression} bag={bag}/>{bag ? <SnackBag/> : <SnackBox front/>}<SauceCup/></g>;
}
