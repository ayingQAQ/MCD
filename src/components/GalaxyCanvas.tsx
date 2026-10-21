import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import type { Dataset, FoodPlanet, NutrientKey, NutritionGraph, SimilarityEdge } from '../data/schema';
import { nutrientNames, stableHash } from '../data/schema';
import type { PlanetPosition } from '../graph/layout';
import { centers } from '../graph/layout';
import { quantile } from '../graph/analysis';
import { focusIds, relationEdges } from '../graph/view';
import { drawPlanet, ink } from '../art/planets';
import { Icon } from './Illustrations';

interface Props {
  dataset: Dataset; graph: NutritionGraph; positions: PlanetPosition[]; visible: Set<string>;
  lens: NutrientKey; selected: string | null; onSelect: (id: string | null) => void;
  route: string[]; routeStep: number; showRelations: boolean; expanded: boolean; showLabels: boolean;
  highlight: SimilarityEdge | null;
}
interface Camera { x: number; y: number; scale: number }
export function GalaxyCanvas(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props); latest.current = props;
  const invalidate = useRef<() => void>(() => undefined);
  const fitRef = useRef<() => void>(() => undefined);
  const zoomRef = useRef<(factor: number) => void>(() => undefined);
  const [zoom, setZoom] = useState(100);
  const camera = useRef<Camera>({ x: 0, y: 0, scale: .65 });
  const hover = useRef<string | null>(null);
  const radii = useRef(new Map<string, number>());
  const sizeRef = useRef({ width: 1000, height: 650 });
  const previousFocus = useRef('');

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const positions = new Map(props.positions.map(p => [p.id, p]));
    const foods = new Map(props.dataset.foods.map(f => [f.id, f]));
    const rc = rough.canvas(canvas);
    let frame = 0, destroyed = false;
    let lensStart = performance.now();
    let previousLens = latest.current.lens;
    let targets = new Map<string, number>();
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
      const elapsed = reduced.matches ? 1 : Math.min(1, (performance.now() - lensStart) / 350);
      for (const [id, target] of targets) radii.current.set(id, (starts.get(id) ?? target) + (target - (starts.get(id) ?? target)) * (1 - (1 - elapsed) ** 3));
      const { width, height } = sizeRef.current, c = camera.current;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
      // Doodles use stable seeds; the drawing sleeps when nothing changes.
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(c.scale, c.scale);
      for (let i = 0; i < 80; i++) {
        const h = stableHash(`sky-${i}`), x = (h % 2400) - 1200, y = (Math.floor(h / 2400) % 1800) - 900;
        ctx.strokeStyle = i % 3 ? '#D4C9B6' : '#D9B968'; ctx.lineWidth = 1 / c.scale;
        ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke();
      }
      for (const [category, [cx, cy]] of Object.entries(centers)) {
        const count = p.dataset.foods.filter(f => f.category === category && p.visible.has(f.id)).length;
        if (!count) continue;
        ctx.font = '13px "Cosmos Hand", sans-serif'; ctx.fillStyle = '#9F9482'; ctx.textAlign = 'center';
        ctx.fillText(({ burger: 'THE BURGER ORBIT', breakfast: 'GOOD MORNING', side: 'LITTLE BITES', drink: 'SIP & WANDER', dessert: 'SWEET DREAMS', other: 'THE UNKNOWN' } as Record<string, string>)[category], cx, cy - 180);
      }
      const relations = new Set(p.showRelations ? relationEdges(p.graph, p.selected, p.expanded, p.visible) : []);
      const routePairs = new Set(p.route.slice(1, Math.max(1, p.routeStep + 1)).map((id, i) => [id, p.route[i]].sort().join(':')));
      const drawingEdges = p.highlight ? [...p.graph.edges.filter(e => !([e.source, e.target].includes(p.highlight!.source) && [e.source, e.target].includes(p.highlight!.target))), p.highlight] : p.graph.edges;
      for (const e of drawingEdges) {
        const inRoute = routePairs.has([e.source, e.target].sort().join(':'));
        const isDiscovery = e === p.highlight;
        const show = inRoute || isDiscovery || relations.has(e);
        if (!show || !p.visible.has(e.source) || !p.visible.has(e.target)) continue;
        const a = positions.get(e.source)!, b = positions.get(e.target)!;
        ctx.strokeStyle = isDiscovery ? '#9276AF' : inRoute ? '#BD7043' : '#A99E89'; ctx.lineWidth = (inRoute || isDiscovery ? 2.8 : 1.2) / c.scale; ctx.setLineDash(inRoute || isDiscovery ? [8 / c.scale, 5 / c.scale] : [3 / c.scale, 5 / c.scale]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - 22, b.x, b.y); ctx.stroke();
      }
      ctx.setLineDash([]);
      const visibleFoods: FoodPlanet[] = p.dataset.foods.filter(f => p.visible.has(f.id));
      for (const food of visibleFoods) {
        const pos = positions.get(food.id)!;
        const sx = pos.x * c.scale + c.x, sy = pos.y * c.scale + c.y;
        if (sx < -90 || sx > width + 90 || sy < -90 || sy > height + 90) continue;
        const selected = p.selected === food.id || p.highlight?.target === food.id, isHover = hover.current === food.id;
        ctx.globalAlpha = p.route.length && !p.route.includes(food.id) ? .35 : 1;
        const radius = (radii.current.get(food.id) ?? 30) * (selected || isHover ? 1.12 : 1);
        drawPlanet(ctx, food, pos.x, pos.y, radius, selected);
        if (food.nutrition[p.lens] === null) { ctx.font = '16px sans-serif'; ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.fillText('?', pos.x, pos.y + 5); }
        const featured = /^(巨无霸|麦香鱼|麦香鸡|中薯条|草莓新地|猪柳蛋麦满分|可乐中杯|奥利奥麦旋风|纯牛奶（盒装）|脆薯饼)$/.test(food.name);
        if (selected || isHover || p.showLabels || featured || visibleFoods.length <= 24) {
          ctx.save(); ctx.translate(pos.x, pos.y + radius + 17 / c.scale); ctx.scale(1 / c.scale, 1 / c.scale);
          ctx.font = `${selected ? '600' : '400'} 12px "Cosmos Body", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const text = food.name.length > 13 ? `${food.name.slice(0, 12)}…` : food.name;
          const tw = ctx.measureText(text).width;
          ctx.fillStyle = selected ? '#FFF0CA' : '#FFF9EDEB'; ctx.beginPath(); ctx.roundRect(-tw / 2 - 6, -9, tw + 12, 19, 5); ctx.fill();
          ctx.fillStyle = ink; ctx.fillText(text, 0, 0); ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      // A quiet hand-drawn comet in the margin, not a particle field.
      rc.path('M-730 -390Q-680 -405 -630 -380', { seed: 9, stroke: '#C4AE7E', strokeWidth: 1.3, roughness: .7 });
      ctx.restore();
      if (elapsed < 1) requestDraw();
    }
    function fit() {
      const points = props.positions;
      if (!points.length) return;
      const { width, height } = sizeRef.current;
      const minX = Math.min(...points.map(p => p.x)) - 80, maxX = Math.max(...points.map(p => p.x)) + 80;
      const minY = Math.min(...points.map(p => p.y)) - 80, maxY = Math.max(...points.map(p => p.y)) + 80;
      const scale = Math.max(.25, Math.min(1, width / (maxX - minX), height / (maxY - minY)));
      camera.current = { x: width / 2 - (minX + maxX) / 2 * scale, y: height / 2 - (minY + maxY) / 2 * scale, scale };
      setZoom(Math.round(scale * 100)); requestDraw();
    }
    fitRef.current = fit;
    function zoomAt(factor: number, x: number, y: number) {
      const c = camera.current, scale = Math.max(.25, Math.min(2.6, c.scale * factor));
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
    });
    observer.observe(canvas);
    const coords = (event: PointerEvent | WheelEvent) => { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
    const hit = (x: number, y: number) => {
      const c = camera.current;
      const worldX = (x - c.x) / c.scale, worldY = (y - c.y) / c.scale;
      return [...foods.values()].reverse().find(f => latest.current.visible.has(f.id) && Math.hypot(positions.get(f.id)!.x - worldX, positions.get(f.id)!.y - worldY) <= (radii.current.get(f.id) ?? 30) + 5 / c.scale)?.id ?? null;
    };
    const wheel = (event: WheelEvent) => { event.preventDefault(); const point = coords(event); zoomAt(Math.exp(-event.deltaY * .0015), point.x, point.y); setZoom(Math.round(camera.current.scale * 100)); };
    const pointerDown = (event: PointerEvent) => { canvas.setPointerCapture(event.pointerId); const point = coords(event); pointerMap.set(event.pointerId, point); if (pointerMap.size === 1) down = { ...point, moved: false }; else if (down) down.moved = true; canvas.style.cursor = 'grabbing'; };
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
    const pointerEnd = (event: PointerEvent) => { const point = coords(event); if (event.type === 'pointerup' && pointerMap.size === 1 && down && !down.moved) latest.current.onSelect(hit(point.x, point.y)); pointerMap.delete(event.pointerId); if (!pointerMap.size) down = null; else if (down) down.moved = true; canvas.style.cursor = 'grab'; setZoom(Math.round(camera.current.scale * 100)); requestDraw(); };
    const leave = () => { hover.current = null; requestDraw(); };
    const visibility = () => { if (!document.hidden) requestDraw(); };
    canvas.addEventListener('wheel', wheel, { passive: false }); canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointermove', pointerMove); canvas.addEventListener('pointerup', pointerEnd); canvas.addEventListener('pointercancel', pointerEnd); canvas.addEventListener('pointerleave', leave); document.addEventListener('visibilitychange', visibility);
    return () => { destroyed = true; cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener('wheel', wheel); canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointermove', pointerMove); canvas.removeEventListener('pointerup', pointerEnd); canvas.removeEventListener('pointercancel', pointerEnd); canvas.removeEventListener('pointerleave', leave); document.removeEventListener('visibilitychange', visibility); };
  }, [props.positions, props.dataset]);

  useEffect(() => {
    const ids = focusIds(props.selected, props.route, props.highlight), key = `${ids.join(':')}:${!!props.selected}`;
    if (ids.length && key !== previousFocus.current) {
      const points = props.positions.filter(point => ids.includes(point.id));
      if (points.length) {
        const width = sizeRef.current.width, height = sizeRef.current.height;
        const availableWidth = width > 750 && props.selected ? width - 340 : width;
        const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
        const scale = points.length === 1 ? Math.max(.9, camera.current.scale) : Math.max(.25, Math.min(1.2, availableWidth / (maxX - minX + 180), (height * (width < 520 && props.selected ? .3 : .7)) / (maxY - minY + 180)));
        camera.current = { x: availableWidth / 2 - (minX + maxX) / 2 * scale, y: height * (width < 520 && props.selected ? .25 : .48) - (minY + maxY) / 2 * scale, scale };
        setZoom(Math.round(scale * 100));
      }
    }
    previousFocus.current = key; invalidate.current();
  }, [props.selected, props.lens, props.visible, props.route, props.routeStep, props.showRelations, props.expanded, props.showLabels, props.positions, props.highlight]);

  return <>
    <canvas ref={canvasRef} className="galaxy-canvas" role="img" aria-label={`餐品营养星图，当前透镜：${nutrientNames[props.lens]}。请使用左侧餐品列表进行键盘探索。`}/>
    <div className="canvas-hint"><span className="tiny-orbit"/> 拖动去漫游 · 滚轮或双指缩放</div>
    <div className="zoom-tools" aria-label="画布视图控制"><button onClick={() => zoomRef.current(.8)} aria-label="缩小">−</button><span>{zoom}%</span><button onClick={() => zoomRef.current(1.25)} aria-label="放大">+</button><i/><button onClick={() => fitRef.current()} aria-label="重置视图"><Icon name="reset" size={17}/></button></div>
  </>;
}
