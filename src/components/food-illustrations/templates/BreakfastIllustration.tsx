import { illustrationPalette as p } from '../palette';
import { Outline, SketchLine } from '../primitives/Outline';
import { Highlight, Shadow } from '../primitives/Light';
import { EggLayer, BaconLayer } from '../ingredients/Layers';
import { Face } from '../primitives/Face';
import type { DrawingContext } from '../types';
export function MuffinBun({ top = false, detail = 'full' }: { top?: boolean; detail?: DrawingContext['detail'] }) { return <g><Outline d={top ? 'M26 59q-1-20 48-23 48-1 58 19l-2 20q-11 16-54 15-43-1-50-15Z' : 'M25 109q52-15 106-1l-3 18q-46 19-99 0Z'} fill={p.bunInside}/><Shadow d={top ? 'M27 65q52 19 104-2l-1 12q-14 17-54 15-40-1-50-15Z' : 'M29 118q47 13 101-1l-2 9q-49 19-99 0Z'} color={p.bunDark}/>{top && <><path d="M31 56q48-25 94-1" fill="none" stroke={p.white} strokeWidth="3.5" strokeLinecap="round"/>{detail !== 'compact' && <g fill={p.bunDark}><path d="m42 55 4-1 1 3-4 1ZM67 46l3 1-1 3-3-1ZM93 51l3-1 2 2-3 2ZM116 60l2 1-1 3-2-1ZM56 64l2-1 2 3-3 1Z"/></g>}</>}{!top && detail === 'full' && <SketchLine d="m38 122 2 2m11-3 1 3m13 0 2 1m22-2 1 2m14-3 2 1" seed={82}/>}</g>; }
export function BreakfastIllustration({ preset, expression, detail }: DrawingContext) {
  if (preset.variant === 'egg-plate') return <g data-food-body="breakfast"><Outline d="M19 117c-9-16 24-34 64-34s74 15 60 34c-17 24-109 27-124 0Z" fill={p.blue}/><path d="M31 114q44 23 101-4" fill="none" stroke={p.blueShadow} strokeWidth="2" strokeLinecap="round"/>
    <g transform="rotate(13 113 81)"><Outline d="M91 54q-7-9 3-15 20-12 35 1 10 6 2 14l2 54-40 1Z" fill={p.bunDark}/><path d="M98 55q-8-10 3-13 16-5 24 4 2 4-2 10l2 43-27 1Z" fill={p.bunInside}/></g>
    <Outline d="M29 85c-11-16 3-35 21-30 14-16 39-7 40 8 20 2 25 26 9 34 3 23-22 31-36 20-17 5-40-8-34-24Z" fill={p.white} strokeWidth={2.8}/><Outline d="M50 72q19-16 34 3 9 20-14 27-24 1-20-30Z" fill={p.egg} strokeWidth={2.1}/><Highlight d="m58 73q7-5 11-2l-2 3-8 3Z"/><Face expression={expression} x={67} y={84} scale={.55}/></g>;
  const filled = preset.variant !== 'muffin-plain';
  return <g data-food-body="breakfast" transform={filled ? undefined : 'translate(0 9)'}><MuffinBun detail={detail}/>{filled ? <><g transform="translate(24 88)"><EggLayer/></g>{preset.variant === 'muffin-bacon' && <g transform="translate(24 102)"><BaconLayer/></g>}</> : <path d="M28 96q48-15 101 0l-1 15q-50 14-100 0Z" fill={p.bunInside} stroke={p.outline} strokeWidth="2.5"/>}<g transform={filled ? 'translate(0 3)' : 'translate(0 15)'}><MuffinBun top detail={detail}/><Face expression={expression} x={78} y={61} scale={.72}/></g></g>;
}
