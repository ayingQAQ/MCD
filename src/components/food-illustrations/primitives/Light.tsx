import { illustrationPalette as p } from '../palette';
export function Highlight({ d, opacity = .85 }: { d: string; opacity?: number }) { return <path d={d} fill={p.cream} opacity={opacity}/>; }
export function Shadow({ d, color = p.shadow }: { d: string; color?: string }) { return <path d={d} fill={color}/>; }
export function GroundShadow({ wide = false }: { wide?: boolean }) { return <path d={wide ? 'M20 143q60-10 121 0-55 10-121 0Z' : 'M37 145q43-9 87 0-44 9-87 0Z'} fill={p.shadow} opacity=".35"/>; }
