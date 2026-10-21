import { useId } from 'react';
import type { FoodPlanet } from '../data/schema';
import { FoodIllustration } from './food-illustrations/FoodIllustration';
import { resolveFoodIllustration } from './food-illustrations/registry';

export function Star({ className = '', ...rest }: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden="true" {...rest}><path d="m29 5 7 17 19 2-14 13 4 18-16-9-16 9 3-19L3 23l19-2Z" fill="#F1CB66" stroke="#51483F" strokeWidth="2" strokeLinejoin="round"/><path d="m28 9 6 16 16 1" stroke="#fff5cc" strokeWidth="2" strokeLinecap="round"/></svg>;
}
export function PlanetStamp({ food, className = '' }: { food?: FoodPlanet; className?: string }) {
  const id = useId().replace(/:/g, '');
  if (food) return <FoodIllustration foodId={resolveFoodIllustration(food).presetId} size={160} className={`planet-stamp ${className}`} title={`${food.name} · 通用形态示意，非商品配方图`} decorative/>;
  const color = '#F3A38C';
  const variant = 0;
  return <svg className={`planet-stamp ${className}`} viewBox="0 0 120 110" aria-hidden="true">
    <defs><clipPath id={id}><ellipse cx="60" cy="54" rx="36" ry="34" transform="rotate(-9 60 54)"/></clipPath></defs>
    <ellipse cx="61" cy="59" rx="36" ry="34" fill="#e7daca"/>
    <ellipse cx="60" cy="54" rx="36" ry="34" fill={color}/>
    <g clipPath={`url(#${id})`} stroke="#fff7e8" strokeWidth="6" opacity=".55" fill="none">
      {variant % 2 === 0 ? <><path d="M14 37Q60 12 108 39M10 57Q60 34 109 60M15 77Q60 55 108 80"/><path d="m43 23 7-3" strokeWidth="3"/></> : <><circle cx="43" cy="38" r="10" fill="#fff7e8"/><circle cx="82" cy="63" r="12"/><path d="m34 77 12 4M65 21l9 8"/></>}
    </g>
    <path d="M28 70C9 46 30 17 56 19c27-2 46 17 40 43-4 20-20 30-41 26-12-1-20-7-27-18Z" fill="none" stroke="#51483F" strokeWidth="2"/>
    <path d="M27 71c15 12 44 13 62 1 23-15 20-24 5-22M27 48C7 51 8 63 27 71" fill="none" stroke="#51483F" strokeWidth="2"/>
    <circle cx="51" cy="54" r="2" fill="#51483F"/><circle cx="67" cy="54" r="2" fill="#51483F"/><path d="M55 61q5 6 10 0" fill="none" stroke="#51483F" strokeWidth="1.7" strokeLinecap="round"/>
    <path d="m12 19 2 5 5 1-4 3 1 5-5-3-4 3 1-5-4-3 6-1ZM103 80l2 5 5 1-4 3 1 5-5-3-4 3 1-5-4-3 6-1Z" fill="#F1CB66" stroke="#51483F" strokeWidth="1.2"/>
  </svg>;
}
export function Icon({ name, size = 20 }: { name: 'search' | 'arrow' | 'close' | 'zoom' | 'reset' | 'route' | 'filter' | 'download' | 'info' | 'link' | 'list'; size?: number }) {
  const paths = { search: 'm20 20-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0', arrow: 'M4 12h16m-6-6 6 6-6 6', close: 'm6 6 12 12M6 18 18 6', zoom: 'M12 5v14M5 12h14', reset: 'M4 10a8 8 0 1 1 2 8M4 4v6h6', route: 'M6 6c17-8-10 20 12 12M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0M20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0', filter: 'M4 6h16M7 12h10M10 18h4', download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', info: 'M12 11v6M12 7v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', link: 'm9 15 6-6M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0', list: 'M8 6h12M8 12h12M8 18h12M3 6h.1M3 12h.1M3 18h.1' };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}
