import { illustrationPalette as p } from '../palette';
import { Outline, SketchLine } from '../primitives/Outline';
import { Highlight, Shadow } from '../primitives/Light';
import { Face } from '../primitives/Face';
import type { DrawingContext, Expression } from '../types';
export function CupBody({ color = p.blue, transparent = false }: { color?: string; transparent?: boolean }) { return <><Outline d="M38 48q42-11 85-1l-12 84q-30 15-61 0Z" fill={transparent ? 'none' : color}/><Shadow d="m111 53 9-3-12 79-10 3Z" color={transparent ? p.wrapper : p.blueShadow}/></>; }
export function LiquidFill({ color }: { color: string }) { return <><path d="M45 72q37 10 70-1l-8 56q-26 12-53-1Z" fill={color}/><path d="M45 72q35-9 70-1" fill="none" stroke={p.outlineSoft} strokeWidth="1.5" strokeLinecap="round"/></>; }
export function Straw({ bent = true }: { bent?: boolean }) { return <g><Outline d={bent ? 'm82 69 7-51 21-8 3 7-18 7-6 46Z' : 'm88 66-2-57 7-1 2 57Z'} fill={p.pink} strokeWidth={2.2}/><path d={bent ? 'm91 23 3 2m-5 1 4 2m-5 1 4 2' : 'm88 19 5-1m-5 5 5-1'} fill="none" stroke={p.red} strokeWidth="1.8"/></g>; }
export function CupLid({ hot = false }: { hot?: boolean }) { return hot ? <><Outline d="m41 40 5-12q35-9 69 0l5 12 7 4-2 10q-45 9-91-1l-1-9Z" fill={p.chocolate}/><path d="M46 33q31-5 59 0" fill="none" stroke={p.coffee} strokeWidth="3" strokeLinecap="round"/><path d="m90 35 15 1" stroke={p.outline} strokeWidth="3" strokeLinecap="round"/></> : <><Outline d="M33 44q46-12 94-1l2 9q-46 10-98 0Z" fill={p.cream} strokeWidth={2.5}/><SketchLine d="M40 49q37 5 79-1" seed={51}/></>; }
export function IceCubes({ detail = 'full' }: { detail?: DrawingContext['detail'] }) { return <g stroke={p.blueShadow} strokeWidth="1.5" fill={p.white}><path d="m57 72 14-2 3 13-15 2Z"/><path d="m83 77 13-4 5 12-14 4Z"/>{detail === 'full' && <path d="m73 56 12-1 2 11-12 2Z"/>}</g>; }
export function CupLabel({ x = 78, y = 103 }: { x?: number; y?: number }) { return <g transform={`translate(${x} ${y})`} stroke={p.outlineSoft} fill="none" strokeWidth="1.5" strokeLinecap="round"><path d="M-9-2q6-10 16-3 6 10-8 11-12-1-8-8Z"/><path d="M-3-3q5 3 2 8"/></g>; }
export function CupFace({ expression, x = 80, y = 102 }: { expression: Expression; x?: number; y?: number }) { return <Face expression={expression} x={x} y={y} scale={.78}/>; }
export function DrinkIllustration({ preset, expression, detail }: DrawingContext) {
  if (preset.variant === 'carton') return <g data-food-body="drink">
    <Outline d="M48 47 62 24l39 2 15 22-1 88-66 2Z" fill={p.cream}/>
    <Outline d="m62 24 1-10 38 1v11l-13 20-40 1Z" fill={p.white} strokeWidth={2.5}/>
    <path d="m88 46 28 2-1 88-27-9Z" fill={p.blue}/><path d="m49 78 39-2v51l-39 10Z" fill={p.blue}/>
    <SketchLine d="m88 47 1 80m-27-95 24 2m7-5 12 12" seed={71}/>
    <Highlight d="m56 56 7-1v13l-7 2Z"/><CupFace expression={expression} x={69} y={97}/>
    {detail !== 'compact' && <path d="m57 117 17-1m-16 6 10-1" stroke={p.white} strokeWidth={2.5} strokeLinecap="round"/>}
  </g>;
  if (preset.variant === 'bottle') return <g data-food-body="drink">
    <Outline d="M66 26h29l-1 20c0 11 17 15 18 32l-1 51q-30 13-61 0l-1-51c1-17 18-22 18-32Z" fill={p.white}/>
    <path d="M53 80q30 6 54 0v45q-26 10-53 0Z" fill={p.blue}/>
    <Outline d="m64 15 33 1 1 13-35 1Z" fill={p.green} strokeWidth={2.4}/>
    <path d="m53 88 54 1v28l-54-1Z" fill={p.cream}/><CupFace expression={expression} x={80} y={101}/>
    <Highlight d="M62 57q-8 10-7 18l5 1q-1-10 7-15Z"/>
    {detail !== 'compact' && <SketchLine d="m70 19 1 8m8-8v8m8-8v8m-28 96q22 4 43 0" seed={72}/>}
  </g>;
  const ceramic = preset.variant === 'ceramic' || preset.variant === 'espresso', espresso = preset.variant === 'espresso';
  const hot = preset.variant === 'hot-lid', clear = preset.variant === 'cold-clear';
  const liquid = preset.colors?.liquid ?? p.chocolate;
  if (ceramic) return <g data-food-body="drink" transform={espresso ? 'translate(14 31) scale(.82)' : undefined}>
    <Outline d="M116 72c39-8 37 51 2 43l-2-10c22 8 25-29 0-21Z" fill={p.wrapper}/>
    <Outline d="M23 132q56-15 119 0-7 13-59 14-47-1-60-14Z" fill={p.cream} strokeWidth={2.6}/>
    <Outline d="M30 69q49-13 94-1l-4 40q-8 27-42 26-34-2-42-24Z" fill={preset.colors?.container ?? p.cream}/>
    <Outline d="M31 69q47-17 92-1-3 19-47 18-40-1-45-17Z" fill={liquid} strokeWidth={2.4}/>
    <path d={espresso ? 'M56 72q18-8 36 0' : 'M53 72q19-15 41 1-23 17-29-2 16-8 18 4'} fill="none" stroke={p.bunInside} strokeWidth={espresso ? 4 : 3} strokeLinecap="round"/>
    {detail !== 'compact' && <SketchLine d="M54 52q-8-10 0-20m22 16q8-9 0-18" color={p.outlineSoft} seed={53}/>}
    <Highlight d="M40 87q4 2 4 7l3 15-5-1Z"/>{expression === 'neutral' ? <CupLabel y={109}/> : <CupFace expression={expression} y={106}/>}</g>;
  return <g data-food-body="drink"><CupBody transparent={clear} color={preset.colors?.container ?? (hot ? p.wrapper : p.blue)}/>{clear && <LiquidFill color={liquid}/>}{!hot && <Straw bent={clear}/>}<CupLid hot={hot}/>{clear && detail !== 'compact' && <IceCubes detail={detail}/>}
    {hot ? <><path d="m43 71 74-1-6 45q-29 10-61 0Z" fill={p.cream} stroke={p.outlineSoft} strokeWidth="1.5"/>{detail === 'full' && <SketchLine d="m52 80 3 27m9-28 2 30m28-31-3 29m11-30-4 27" seed={58}/>}</> : !clear && <path d="M43 81q36 8 75-1l-3 35q-32 8-68-1Z" fill={p.cream}/>}
    {expression === 'neutral' ? <CupLabel/> : <CupFace expression={expression} y={clear ? 108 : 95}/>}
    {hot && detail !== 'compact' && <SketchLine d="M66 20q-6-8 0-14m12 13q6-7 0-13" color={p.outlineSoft} seed={57}/>}<Highlight d="m47 58 4 2 2 17-4-1Z"/></g>;
}
