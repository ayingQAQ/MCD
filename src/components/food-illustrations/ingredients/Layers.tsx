import { illustrationPalette as p } from '../palette';
import { Outline, SketchLine } from '../primitives/Outline';
import { Highlight } from '../primitives/Light';
import type { DetailLevel, Ingredient } from '../types';
export function BeefPatty({ detail = 'full' }: { detail?: DetailLevel }) { return <g data-ingredient="beef"><Outline d="M0 4 7 1l14 1L34 0l21 2L72 0l17 2 14-1 8 4-2 8-14 3-22-1-17 2-19-2-17 1-18-4Z" fill={p.beef}/>{detail !== 'compact' && <SketchLine d="m9 7 12 1m12-2 8 2m14-2 12 1m14 0 14-1" color={p.beefLight} seed={31}/>}</g>; }
export function ChickenPatty({ detail = 'full' }: { detail?: DetailLevel }) { return <g data-ingredient="chicken"><Outline d="M0 7 4 2l6 1 4-5 9 2 8-3 8 3 9-3 8 3 9-2 7 3 10-2 8 4 7-1 7 6-3 8-9 2-7-2-9 3-11-2-9 2-9-2-10 2-8-3-11 1-8-4Z" fill={p.chicken}/><Highlight d="m9 5 13-3 8 3 10-2-4 5-14-1-10 3Z" opacity={.55}/>{detail === 'full' && <SketchLine d="m18 12 3-2m18 1 4-2m19 3 4-3m18 2 5-1" color={p.outlineSoft} seed={32}/>}</g>; }
export function CheeseSlice() { return <g data-ingredient="cheese"><Outline d="M1 1 108 0 101 6l-17 2-9 7-15-7-20 2-8 10-9-12L5 7Z" fill={p.cheese} strokeWidth={2}/><path d="m13 3 27 1" stroke={p.cream} strokeWidth="1.8" strokeLinecap="round"/></g>; }
export function LettuceLayer() { return <g data-ingredient="lettuce"><Outline d="M-2 5q0-7 8-4 5-7 13-2 8-7 15-1 8-6 15-1 9-6 16-1 8-6 15 0 10-4 14 2 10-2 16 4 4 6-5 7-6 8-15 2-7 7-16 1-8 7-17 1-9 7-17 0-9 6-16 0-9 6-16-1-11 2-8-6Z" fill={p.lettuce} strokeWidth={2.4}/><SketchLine d="M6 6q11-8 22 0t22-1 24 0 24 1" color={p.lettuceShadow} seed={44}/></g>; }
export function EggLayer() { return <g data-ingredient="egg"><Outline d="M1 6C1 0 10 2 15-1s14 1 21-1S49 0 57-2s14 3 21 1 16 0 23 1 13 9 3 13S84 11 77 14s-17-1-24 1-18-2-25 0S0 15 1 6Z" fill={p.white} strokeWidth={2.3}/><path d="M46 3q14-8 27 0l1 9-28 1Z" fill={p.egg}/></g>; }
export function SauceLayer() { return <g data-ingredient="sauce"><path d="M3 2q17-5 34 1t31-1 37 0l-4 5-20-1-4 7-6-7-23 1-5 5-4-6-19 2Z" fill={p.cream} stroke={p.outlineSoft} strokeWidth="1.4" strokeLinejoin="round"/></g>; }
export function PickleLayer() { return <g data-ingredient="pickle" fill={p.green} stroke={p.lettuceShadow} strokeWidth="1.7"><ellipse cx="21" cy="3" rx="17" ry="4" transform="rotate(-8 21 3)"/><ellipse cx="77" cy="3" rx="19" ry="4" transform="rotate(6 77 3)"/><path d="m15 1 2 3m7-4 1 3m46-2 2 3m9-1 2 3"/></g>; }
export function BaconLayer() { return <g data-ingredient="bacon"><Outline d="m1 3 16-3 14 2 13-1 18 3 16-3 16 2 14-2-1 9-16 2-15-3-14 3-17-2-14 2-15-3-15 2Z" fill={p.bacon} strokeWidth={2}/><path d="m7 5 10-1 15 3 13-1 18 3 14-3 16 2 9-3" stroke={p.baconFat} strokeWidth="2.2" fill="none" strokeLinecap="round"/></g>; }
export const layerHeights: Record<Ingredient, number> = { beef: 15, chicken: 19, cheese: 6, lettuce: 9, egg: 14, sauce: 5, pickle: 5, bacon: 10, 'middle-bun': 12 };
export function IngredientLayerArt({ kind, detail }: { kind: Ingredient; detail: DetailLevel }) {
  switch (kind) {
    case 'beef': return <BeefPatty detail={detail}/>;
    case 'chicken': return <ChickenPatty detail={detail}/>;
    case 'cheese': return <CheeseSlice/>;
    case 'lettuce': return <LettuceLayer/>;
    case 'egg': return <EggLayer/>;
    case 'sauce': return <SauceLayer/>;
    case 'pickle': return <PickleLayer/>;
    case 'bacon': return <BaconLayer/>;
    case 'middle-bun': return <g data-ingredient="middle-bun"><Outline d="M0 2q51-6 109 0l-1 11Q52 17 1 12Z" fill={p.bunInside}/><path d="M9 8q44 3 89-1" stroke={p.bunDark} strokeWidth="2" fill="none"/></g>;
  }
}
