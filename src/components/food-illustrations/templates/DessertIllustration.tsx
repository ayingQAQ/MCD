import { illustrationPalette as p } from '../palette';
import { Outline, SketchLine } from '../primitives/Outline';
import { Highlight, Shadow } from '../primitives/Light';
import { Face } from '../primitives/Face';
import type { DrawingContext } from '../types';
export function IceCreamSwirl({ short = false }: { short?: boolean }) { return <g transform={short ? 'translate(7 24) scale(.91 .76)' : undefined}>
  <Outline d="M42 95c-13-8-9-19 5-22-6-9-1-17 13-21-3-9 8-14 15-25 9 3 9 12 17 16 12 3 17 12 9 21 19 1 26 15 14 23 13 5 12 16 1 21-26 9-65 6-74-1-6-4-6-8 0-12Z" fill={p.white}/>
  <Shadow d="M75 27q8 12 4 19 23 1 16 15 21 3 12 16 17 11 4 20-31 12-70 0-4 17 39 15 47 4 39-14-4-11-9-12 16-9-2-21-4-7-15-7 7-10-5-19-10-4-11-9Z" color={p.cream}/>
  <path d="M57 53q13 5 37-3M48 73q27 10 56-4M43 94q32 10 65-4" fill="none" stroke={p.outlineSoft} strokeWidth="2" strokeLinecap="round"/>
  <Highlight d="M67 44q5-8 9-9l-2 8-7 5ZM43 82l8-3 5 2-9 5Z"/>
  </g>; }
export function Cone({ detail }: { detail: DrawingContext['detail'] }) { return <g><Outline d="M47 96q35 9 65-1L86 146q-5 6-10 0Z" fill={p.bunLight}/><Shadow d="m101 99 11-4-26 51q-5 6-10 0Z" color={p.bunDark}/>{detail !== 'compact' && <g stroke={p.outlineSoft} strokeWidth="1.5" fill="none"><path d="m55 106 32 25m-23-28 30 20m-9-20-23 19m35-19-29 27m-2-12 19 16m-13-5 10 10m12-27-19 19"/></g>}</g>; }
export function DessertCup({ tall = false }: { tall?: boolean }) { return tall ? <g><Outline d="M42 83q37-11 76-1l-10 55q-26 10-56-1Z" fill={p.cream}/><Shadow d="m104 88 13-6-9 55-12 3Z" color={p.wrapper}/><path d="M46 102q31 10 67 0" fill="none" stroke={p.purple} strokeWidth="7"/></g> : <g><Outline d="M35 91q44-13 90-1l-13 32-23 12-1 8-20 1-1-9-22-11Z" fill={p.pink}/><Shadow d="m109 95 16-5-13 32-23 12-1 8-9 1 1-20Z" color={p.red}/><path d="M39 100q41 10 81-1" fill="none" stroke={p.cream} strokeWidth="3" strokeLinecap="round"/></g>; }
export function ChocolateDrizzle() { return <g fill="none" stroke={p.chocolate} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><path d="M61 51q12-3 28-1m-37 17q28 7 48-2m-52 20q29 10 56-2m-2 0-3 12"/></g>; }
export function PieCrust({ cut = false, detail = 'full' }: { cut?: boolean; detail?: DrawingContext['detail'] }) { return <g><Outline d={cut ? 'M15 65q1-10 12-11l93-1 18 19-6 47-109 2q-11-2-11-13Z' : 'M22 54q45-8 102 0 12 2 13 14l-3 42q-2 12-15 13l-96-3q-11-1-11-13l1-38q0-13 9-15Z'} fill={p.bunLight}/><Shadow d="m17 106 112 1 5-4-1 11q-2 8-14 9l-96-3q-9-1-11-8Z" color={p.bunDark}/><path d="M25 62q43-4 92 1" stroke={p.cream} strokeWidth="3" fill="none" strokeLinecap="round"/>{detail !== 'compact' && <SketchLine d="m20 69 1 37m6 7 6-1m8 2 5-1m8 2 5-1m8 2 6-1m8 2 5-1m8 2 6-1m8 0 6-1" seed={71}/>}<g stroke={p.outlineSoft} strokeWidth="2.2" fill="none" strokeLinecap="round"><path d="m43 78 10 17m15-18 10 17m15-17 10 17"/></g></g>; }
export function PieFilling() { return <g><Outline d="m119 60 17 13-5 39-17-8Z" fill={p.cream} strokeWidth={2}/><path d="m121 69 11 8-5 26-8-2Z" fill={p.red}/><path d="m123 81 4 5-5 6" fill="none" stroke={p.chocolate} strokeWidth="2" strokeLinecap="round"/></g>; }
export function DessertIllustration({ preset, expression, detail }: DrawingContext) {
  const pie = preset.variant === 'pie' || preset.variant === 'berry-pie';
  if (pie) return <g data-food-body="dessert" transform="rotate(-12 80 87)"><PieCrust cut={preset.variant === 'berry-pie'} detail={detail}/>{preset.variant === 'berry-pie' && <PieFilling/>}</g>;
  const cone = preset.variant === 'cone' || preset.variant === 'chocolate-cone', cookie = preset.variant === 'cookie-cup';
  return <g data-food-body="dessert">{cone ? <Cone detail={detail}/> : <DessertCup tall={cookie}/>}{cookie && <Outline d="m112 89 10-66q5-10 11-3l-10 69Z" fill={p.blue} strokeWidth={2.2}/>}<IceCreamSwirl short={!cone}/>{preset.variant === 'chocolate-cone' && <ChocolateDrizzle/>}
    {cookie && <g fill={p.chocolate} stroke={p.outline} strokeWidth="1.3"><path d="m55 73 9-3 4 7-10 3ZM80 67l8 2-1 8-9-3ZM94 82l8-3 4 7-10 3Z"/></g>}
    {preset.variant === 'sundae' && <g><path d="M48 87q25-15 52-1l7 10-49 1Z" fill={p.red}/><Outline d="M93 70q16-10 21 4-3 16-12 22-11-8-9-26Z" fill={p.red} strokeWidth={2}/><path d="m96 70 5 3 7-6m-4 8 5 0" fill="none" stroke={p.lettuceShadow} strokeWidth="2"/>{detail === 'full' && <path d="m100 80 1 2m5 2 1 2m-4 3 1 1" stroke={p.cream} strokeWidth="1.5"/>}</g>}
    <Face expression={expression} x={cone ? 80 : 78} y={cone ? 79 : cookie ? 116 : 112} scale={cone ? .65 : .7}/>
  </g>;
}
