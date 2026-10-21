import { useEffect, useRef, useState } from 'react';
import type { Dataset, FoodPlanet, NutrientKey, NutritionGraph, SimilarityEdge } from '../data/schema';
import { categoryNames, nutrientNames, stableHash } from '../data/schema';
import type { PlanetPosition } from '../graph/layout';
import { clusterBounds } from '../graph/layout';
import { quantile } from '../graph/analysis';
import { focusIds, relationEdges } from '../graph/view';
import { drawPlanet, ink, shades } from '../art/planets';
import { Icon } from './Illustrations';

interface Props {
  dataset: Dataset; graph: NutritionGraph; positions: PlanetPosition[]; visible: Set<string>;
  lens: NutrientKey; selected: string | null; onSelect: (id: string | null) => void;
  route: string[]; routeStep: number; showRelations: boolean; expanded: boolean; showLabels: boolean;
  highlight: SimilarityEdge | null;
  onRelationSelect?: (edge: SimilarityEdge) => void;
  /** Screen area covered by floating panels (left sidebar, bottom dock), kept clear when framing. */
  insets?: () => { left: number; bottom: number };
  /** Changing this value re-frames the whole sky (e.g. after the side panel collapses). */
  fitKey?: string | number | boolean;
}
interface Camera { x: number; y: number; scale: number }
export function GalaxyCanvas(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props); latest.current = props;
  const invalidate = useRef<() => void>(() => undefined);
  const fitRef = useRef<() => void>(() => undefined);
  const zoomRef = useRef<(factor: number) => void>(() => undefined);
  const [zoom, setZoom] = useState(100);
  const [viewRevision,setViewRevision]=useState(0);
  const camera = useRef<Camera>({ x: 0, y: 0, scale: .65 });
  const cameraTween=useRef<{start:number;from:Camera;to:Camera}|null>(null);
  const hover = useRef<string | null>(null);
  const radii = useRef(new Map<string, number>());
  const sizeRef = useRef({ width: 1000, height: 650 });
  const previousFocus = useRef('');

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const positions = new Map(props.positions.map(p => [p.id, p]));
    const foods = new Map(props.dataset.foods.map(f => [f.id, f]));
    const clusters = clusterBounds(props.positions);
    const galaxyMotto: Record<string, string> = { burger: 'THE BURGER ORBIT', breakfast: 'GOOD MORNING', side: 'LITTLE BITES', drink: 'SIP & WANDER', dessert: 'SWEET DREAMS', other: 'THE UNKNOWN' };
    // Three star layers in screen space; nearer layers drift more with the camera (parallax).
    const stars = Array.from({ length: 220 }, (_, i) => { const h = stableHash(`star-${i}`); return { x: (h % 10007) / 10007, y: (Math.floor(h / 10007) % 9973) / 9973, layer: i % 3, size: .6 + (h % 7) / 6, gold: h % 9 === 0 }; });
    let frame = 0, idle = 0, destroyed = false;
    let lensStart = performance.now();
    let previousLens = latest.current.lens;
    let targets = new Map<string, number>();
    let drawnEdges: SimilarityEdge[] = [];
    let starts = new Map<string, number>();
    const pointerMap = new Map<number, { x: number; y: number }>();
    let down: { x: number; y: number; moved: boolean } | null = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    function updateRadii() {
      const lens = latest.current.lens;
      const values = props.dataset.foods.flatMap(f => f.nutrition[lens] === null ? [] : [f.nutrition[lens]!]).sort((a, b) => a - b);
      const lo = quantile(values, .05), hi = quantile(values, .95);
      starts = new Map(radii.current);
      targets = new Map(props.dataset.foods.map(f => {
        const value = f.nutrition[lens];
        return [f.id, value === null ? 16 : hi === lo ? 30 : 21 + 20 * Math.sqrt(Math.max(0, Math.min(1, (value - lo) / (hi - lo))))];
      }));
      lensStart = performance.now(); previousLens = lens;
    }
    updateRadii();
    function requestDraw() { if (!frame && !destroyed && !document.hidden) frame = requestAnimationFrame(draw); }
    invalidate.current = requestDraw;
    function draw() {
      frame = 0;
      if (destroyed) return;
      const p = latest.current;
      if (previousLens !== p.lens) updateRadii();
      if(cameraTween.current){const tween=cameraTween.current,t=Math.min(1,(performance.now()-tween.start)/380),ease=1-(1-t)**3;camera.current={x:tween.from.x+(tween.to.x-tween.from.x)*ease,y:tween.from.y+(tween.to.y-tween.from.y)*ease,scale:tween.from.scale+(tween.to.scale-tween.from.scale)*ease};if(t>=1)cameraTween.current=null;}
      const elapsed = reduced.matches ? 1 : Math.min(1, (performance.now() - lensStart) / 350);
      for (const [id, target] of targets) radii.current.set(id, (starts.get(id) ?? target) + (target - (starts.get(id) ?? target)) * (1 - (1 - elapsed) ** 3));
      const { width, height } = sizeRef.current, c = camera.current;
      canvas.dataset.camera = JSON.stringify(c);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
      // Deep sky: parallax stars drawn before the world transform.
      for (const star of stars) {
        const depth = [.04, .1, .2][star.layer], span = 1.4;
        const sx = (((star.x * width * span + c.x * depth) % (width * span)) + width * span) % (width * span) - width * .2;
        const sy = (((star.y * height * span + c.y * depth) % (height * span)) + height * span) % (height * span) - height * .2;
        ctx.globalAlpha = .35 + star.layer * .2; ctx.fillStyle = star.gold ? '#D9B968' : '#C9BBA2';
        if (star.gold && star.layer === 2) { ctx.strokeStyle = '#D9B968'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx - 4, sy); ctx.lineTo(sx + 4, sy); ctx.moveTo(sx, sy - 4); ctx.lineTo(sx, sy + 4); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(sx, sy, star.size * (.6 + star.layer * .3), 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(c.scale, c.scale);
      // Each category is its own galaxy: a soft nebula, a dashed orbit and a name.
      for (const cluster of clusters) {
        const shown = p.dataset.foods.some(f => f.category === cluster.category && p.visible.has(f.id));
        const tone = shades[cluster.category];
        ctx.globalAlpha = shown ? 1 : .25;
        const nebula = ctx.createRadialGradient(cluster.x, cluster.y, cluster.radius * .1, cluster.x, cluster.y, cluster.radius * 1.15);
        nebula.addColorStop(0, `${tone.glow}38`); nebula.addColorStop(.6, `${tone.glow}1C`); nebula.addColorStop(1, `${tone.glow}00`);
        ctx.fillStyle = nebula; ctx.beginPath(); ctx.arc(cluster.x, cluster.y, cluster.radius * 1.15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = tone.dark; ctx.globalAlpha = (shown ? .28 : .1); ctx.lineWidth = 1.2 / c.scale; ctx.setLineDash([6 / c.scale, 9 / c.scale]);
        ctx.beginPath(); ctx.ellipse(cluster.x, cluster.y, cluster.radius * 1.04, cluster.radius * .98, -.12, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = shown ? 1 : .35;
        ctx.save(); ctx.translate(cluster.x, cluster.y - cluster.radius * 1.04 - 14 / c.scale); ctx.scale(1 / c.scale, 1 / c.scale);
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.font = '600 15px "ZCOOL KuaiLe", "Microsoft YaHei", sans-serif'; ctx.fillStyle = tone.dark; ctx.fillText(`${categoryNames[cluster.category]} · ${cluster.count}`, 0, 0);
        ctx.font = '600 9px Nunito, sans-serif'; ctx.fillStyle = '#A8987E'; ctx.fillText(galaxyMotto[cluster.category], 0, -20);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      const relations = new Set(p.showRelations ? relationEdges(p.graph, p.selected, p.expanded, p.visible) : []);
      const routePairs = new Set(p.route.slice(1, Math.max(1, p.routeStep + 1)).map((id, i) => [id, p.route[i]].sort().join(':')));
      const drawingEdges = p.highlight ? [...p.graph.edges.filter(e => !([e.source, e.target].includes(p.highlight!.source) && [e.source, e.target].includes(p.highlight!.target))), p.highlight] : p.graph.edges;
      drawnEdges = [];
      for (const e of drawingEdges) {
        const inRoute = routePairs.has([e.source, e.target].sort().join(':'));
        const isDiscovery = e === p.highlight;
        const show = inRoute || isDiscovery || relations.has(e);
        if (!show || !p.visible.has(e.source) || !p.visible.has(e.target)) continue;
        drawnEdges.push(e);
        const a = positions.get(e.source)!, b = positions.get(e.target)!;
        ctx.strokeStyle = isDiscovery ? '#9276AF' : inRoute ? '#BD7043' : '#A99E89'; ctx.lineWidth = (inRoute || isDiscovery ? 2.8 : 1.2) / c.scale; ctx.setLineDash(inRoute || isDiscovery ? [8 / c.scale, 5 / c.scale] : [3 / c.scale, 5 / c.scale]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - 22, b.x, b.y); ctx.stroke();
      }
      ctx.setLineDash([]);
      const visibleFoods: FoodPlanet[] = p.dataset.foods.filter(f => p.visible.has(f.id));
      const now = performance.now(), floating = !reduced.matches && !pointerMap.size;
      const labels: { food: FoodPlanet; x: number; y: number; radius: number; selected: boolean; hovered: boolean }[] = [];
      for (const food of visibleFoods) {
        const pos = positions.get(food.id)!;
        const sx = pos.x * c.scale + c.x, sy = pos.y * c.scale + c.y;
        if (sx < -90 || sx > width + 90 || sy < -90 || sy > height + 90) continue;
        const selected = p.selected === food.id || p.highlight?.target === food.id || p.route[p.routeStep] === food.id, isHover = hover.current === food.id;
        ctx.globalAlpha = p.route.length && !p.route.includes(food.id) ? .35 : 1;
        const radius = (radii.current.get(food.id) ?? 30) * (selected || isHover ? 1.12 : 1);
        // A slow, per-planet bob keeps the sky alive without moving hit targets noticeably.
        const phase = (stableHash(food.id) % 628) / 100, bob = floating ? Math.sin(now / 1400 + phase) * 2.2 : 0;
        drawPlanet(ctx, food, pos.x, pos.y + bob, radius, selected);
        if (food.nutrition[p.lens] === null) { ctx.font = '16px sans-serif'; ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.fillText('?', pos.x, pos.y + bob + 5); }
        labels.push({ food, x: pos.x, y: pos.y + bob, radius, selected, hovered: isHover });
      }
      ctx.globalAlpha = 1;
      // Labels: selected and hovered first, then larger planets; skip any that would collide on screen.
      const featured = /^(巨无霸|麦香鱼|麦香鸡|中薯条|草莓新地|猪柳蛋麦满分|可乐中杯|奥利奥麦旋风|纯牛奶（盒装）|脆薯饼)$/;
      const placed: [number, number, number, number][] = [];
      const showAll = p.showLabels || visibleFoods.length <= 24 || c.scale >= .95;
      labels.sort((a, b) => Number(b.selected) - Number(a.selected) || Number(b.hovered) - Number(a.hovered) || Number(featured.test(b.food.name)) - Number(featured.test(a.food.name)) || b.radius - a.radius);
      ctx.font = '400 12px Nunito, "Microsoft YaHei", sans-serif';
      for (const label of labels) {
        const wanted = label.selected || label.hovered || showAll || featured.test(label.food.name) || c.scale >= .6 && label.radius >= 34;
        if (!wanted) continue;
        const text = label.food.name.length > 13 ? `${label.food.name.slice(0, 12)}…` : label.food.name;
        const tw = ctx.measureText(text).width + 12;
        const lx = label.x * c.scale + c.x, ly = (label.y + label.radius) * c.scale + c.y + 15;
        const box: [number, number, number, number] = [lx - tw / 2, ly - 10, lx + tw / 2, ly + 10];
        if (!label.selected && !label.hovered && placed.some(o => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1])) continue;
        placed.push(box);
        ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = `${label.selected ? '700' : '400'} 12px Nunito, "Microsoft YaHei", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = label.selected ? '#FFF0CA' : '#FFFBF2E6'; ctx.strokeStyle = label.selected ? '#C18544' : '#DCD0BA'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(box[0], box[1], tw, 20, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = ink; ctx.fillText(text, lx, ly + .5); ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      if (elapsed < 1 || cameraTween.current) requestDraw();
      else if (floating && !idle) idle = window.setTimeout(() => { idle = 0; requestDraw(); }, 33);
    }
    function fit() {
      cameraTween.current=null;
      const points = props.positions;
      if (!points.length) return;
      const { width, height } = sizeRef.current, left = Math.min(latest.current.insets?.().left ?? 0, width * .45), usable = width - left;
      const minX = Math.min(...points.map(p => p.x)) - 80, maxX = Math.max(...points.map(p => p.x)) + 80;
      const minY = Math.min(...points.map(p => p.y)) - 80, maxY = Math.max(...points.map(p => p.y)) + 80;
      const scale = Math.max(.2, Math.min(1, usable / (maxX - minX), height / (maxY - minY)));
      camera.current = { x: left + usable / 2 - (minX + maxX) / 2 * scale, y: height / 2 - (minY + maxY) / 2 * scale, scale };
      setZoom(Math.round(scale * 100)); requestDraw();
    }
    fitRef.current = fit;
    function zoomAt(factor: number, x: number, y: number) {
      cameraTween.current=null;
      const c = camera.current, scale = Math.max(.2, Math.min(2.6, c.scale * factor));
      camera.current = { x: x - (x - c.x) * scale / c.scale, y: y - (y - c.y) * scale / c.scale, scale };
      requestDraw();
    }
    zoomRef.current = factor => { zoomAt(factor, sizeRef.current.width / 2, sizeRef.current.height / 2); setZoom(Math.round(camera.current.scale * 100)); };
    let initialized = false;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (!width || !height) return;
      const old = sizeRef.current;
      sizeRef.current = { width, height };
      const dpr = Math.min(2, devicePixelRatio || 1); canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      if (!initialized) { fit(); initialized = true; }
      else { camera.current.x += (width - old.width) / 2; camera.current.y += (height - old.height) / 2; requestDraw(); }
      previousFocus.current='';setViewRevision(value=>value+1);
    });
    observer.observe(canvas);
    const coords = (event: PointerEvent | WheelEvent) => { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
    const hit = (x: number, y: number) => {
      const c = camera.current;
      const worldX = (x - c.x) / c.scale, worldY = (y - c.y) / c.scale;
      return [...foods.values()].reverse().find(f => latest.current.visible.has(f.id) && Math.hypot(positions.get(f.id)!.x - worldX, positions.get(f.id)!.y - worldY) <= (radii.current.get(f.id) ?? 30) + 5 / c.scale)?.id ?? null;
    };
    const wheel = (event: WheelEvent) => { event.preventDefault(); const point = coords(event); zoomAt(Math.exp(-event.deltaY * .0015), point.x, point.y); setZoom(Math.round(camera.current.scale * 100)); };
    const pointerDown = (event: PointerEvent) => { cameraTween.current=null;canvas.setPointerCapture(event.pointerId); const point = coords(event); pointerMap.set(event.pointerId, point); if (pointerMap.size === 1) down = { ...point, moved: false }; else if (down) down.moved = true; canvas.style.cursor = 'grabbing'; };
    const pointerMove = (event: PointerEvent) => {
      const point = coords(event), old = pointerMap.get(event.pointerId);
      if (old) {
        const before = [...pointerMap.values()]; pointerMap.set(event.pointerId, point);
        if (pointerMap.size === 2) {
          const after = [...pointerMap.values()]; const prevDistance = Math.hypot(before[0].x - before[1].x, before[0].y - before[1].y);
          const newDistance = Math.hypot(after[0].x - after[1].x, after[0].y - after[1].y);
          const oldMid = { x: (before[0].x + before[1].x) / 2, y: (before[0].y + before[1].y) / 2 }, mid = { x: (after[0].x + after[1].x) / 2, y: (after[0].y + after[1].y) / 2 };
          zoomAt(prevDistance > 0 ? newDistance / prevDistance : 1, oldMid.x, oldMid.y); camera.current.x += mid.x - oldMid.x; camera.current.y += mid.y - oldMid.y;
        } else if (pointerMap.size === 1) { camera.current.x += point.x - old.x; camera.current.y += point.y - old.y; }
        if (down && Math.hypot(point.x - down.x, point.y - down.y) > 5) down.moved = true;
      } else { hover.current = hit(point.x, point.y); canvas.style.cursor = hover.current ? 'pointer' : 'grab'; }
      requestDraw();
    };
    const pointerEnd = (event: PointerEvent) => {
      const point=coords(event);
      if(event.type==='pointerup'&&pointerMap.size===1&&down&&!down.moved){
        const foodId=hit(point.x,point.y);let edge:SimilarityEdge|undefined;
        if(!foodId){const c=camera.current,wx=(point.x-c.x)/c.scale,wy=(point.y-c.y)/c.scale;edge=drawnEdges.find(e=>{const a=positions.get(e.source)!,b=positions.get(e.target)!,cx=(a.x+b.x)/2,cy=(a.y+b.y)/2-22;let previous={x:a.x,y:a.y};for(let i=1;i<=40;i++){const t=i/40,u=1-t,next={x:u*u*a.x+2*u*t*cx+t*t*b.x,y:u*u*a.y+2*u*t*cy+t*t*b.y},dx=next.x-previous.x,dy=next.y-previous.y,length=dx*dx+dy*dy,projection=length?Math.max(0,Math.min(1,((wx-previous.x)*dx+(wy-previous.y)*dy)/length)):0;if(Math.hypot(previous.x+projection*dx-wx,previous.y+projection*dy-wy)<8/c.scale)return true;previous=next;}return false;});}
        if(edge)latest.current.onRelationSelect?.(edge);else latest.current.onSelect(foodId);
      }
      pointerMap.delete(event.pointerId);if(!pointerMap.size)down=null;else if(down)down.moved=true;canvas.style.cursor='grab';setZoom(Math.round(camera.current.scale*100));requestDraw();
    };
    const leave = () => { hover.current = null; requestDraw(); };
    const visibility = () => { if (!document.hidden) requestDraw(); };
    canvas.addEventListener('wheel', wheel, { passive: false }); canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointermove', pointerMove); canvas.addEventListener('pointerup', pointerEnd); canvas.addEventListener('pointercancel', pointerEnd); canvas.addEventListener('pointerleave', leave); document.addEventListener('visibilitychange', visibility);
    return () => { destroyed = true; cancelAnimationFrame(frame); clearTimeout(idle); observer.disconnect(); canvas.removeEventListener('wheel', wheel); canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointermove', pointerMove); canvas.removeEventListener('pointerup', pointerEnd); canvas.removeEventListener('pointercancel', pointerEnd); canvas.removeEventListener('pointerleave', leave); document.removeEventListener('visibilitychange', visibility); };
  }, [props.positions, props.dataset]);

  useEffect(() => {
    const ids = focusIds(props.selected, props.route, props.highlight), key = `${ids.join(':')}:${!!props.selected}`;
    if (ids.length && key !== previousFocus.current) {
      const points = props.positions.filter(point => ids.includes(point.id));
      if (points.length) {
        const inset = props.insets?.() ?? { left: 0, bottom: 0 }, bottom = inset.bottom;
        const width = sizeRef.current.width, height = sizeRef.current.height;
        const left = width > 850 ? Math.min(inset.left, width * .45) : 0;
        const availableWidth = (width > 750 && props.selected ? width - 360 : width) - left;
        const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
        const scale = points.length === 1 ? Math.max(.9, camera.current.scale) : Math.max(.2, Math.min(1.2, availableWidth / (maxX - minX + 180), ((height - Math.min(bottom, height * .4)) * (width < 520 && props.selected ? .3 : .75)) / (maxY - minY + 180)));
        const covered = width < 520 && props.selected ? 0 : Math.min(bottom, height * .4), framed = height - covered;
        const nextCamera={ x: left + availableWidth / 2 - (minX + maxX) / 2 * scale, y: (width < 520 && props.selected ? height * .25 : framed * .5) - (minY + maxY) / 2 * scale, scale };
        if(matchMedia('(prefers-reduced-motion: reduce)').matches)camera.current=nextCamera;
        else cameraTween.current={start:performance.now(),from:{...camera.current},to:nextCamera};
        setZoom(Math.round(scale * 100));
      }
    }
    previousFocus.current = key; invalidate.current();
  }, [props.selected, props.lens, props.visible, props.route, props.routeStep, props.showRelations, props.expanded, props.showLabels, props.positions, props.highlight,viewRevision]);

  const firstFit = useRef(true);
  useEffect(() => { if (firstFit.current) { firstFit.current = false; return; } if (!latest.current.selected && !latest.current.route.length && !latest.current.highlight) fitRef.current(); }, [props.fitKey]);
  return <>
    <canvas ref={canvasRef} className="galaxy-canvas" data-lens={props.lens} role="img" aria-label={`餐品营养星图，当前透镜：${nutrientNames[props.lens]}。请使用左侧餐品列表进行键盘探索。`}/>
    <div className="canvas-hint"><span className="tiny-orbit"/> 拖动去漫游 · 滚轮或双指缩放</div>
    <div className="zoom-tools" aria-label="画布视图控制"><button onClick={() => zoomRef.current(.8)} aria-label="缩小">−</button><span>{zoom}%</span><button onClick={() => zoomRef.current(1.25)} aria-label="放大">+</button><i/><button onClick={() => fitRef.current()} aria-label="重置视图"><Icon name="reset" size={17}/></button></div>
  </>;
}
