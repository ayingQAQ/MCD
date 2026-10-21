import { useEffect, useRef, useState } from 'react';
import type { Dataset, FoodPlanet, NutrientKey, NutritionGraph, SimilarityEdge } from '../data/schema';
import { categoryNames, nutrientNames, stableHash } from '../data/schema';
import type { PlanetPosition } from '../graph/layout';
import { clusterBounds } from '../graph/layout';
import { projectPoint, zoomCameraAt, frameDepthPoints } from '../graph/depth';
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
    const clusters = clusterBounds(props.positions);
    const galaxyMotto: Record<string, string> = { burger: 'THE BURGER ORBIT', breakfast: 'GOOD MORNING', side: 'LITTLE BITES', drink: 'SIP & WANDER', dessert: 'SWEET DREAMS', other: 'THE UNKNOWN' };
    // Three star layers in screen space; nearer layers drift more with the camera (parallax).
    const stars = Array.from({ length: 220 }, (_, i) => { const h = stableHash(`star-${i}`); return { x: (h % 10007) / 10007, y: (Math.floor(h / 10007) % 9973) / 9973, layer: i % 3, size: .6 + (h % 7) / 6, gold: h % 9 === 0 }; });
    let frame = 0, idle = 0, destroyed = false;
    let lensStart = performance.now();
    let previousLens = latest.current.lens;
    let targets = new Map<string, number>();
    let drawnEdges: {edge: SimilarityEdge; points: {x:number;y:number;depth:number}[]}[] = [];
    let drawnPlanets: {id:string;x:number;y:number;radius:number;depth:number}[] = [];
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
      // Tilted nebulae recede in perspective; no enclosing category discs.
      for (const cluster of [...clusters].sort((a,b)=>b.depth-a.depth)) {
        const shown = p.dataset.foods.some(f => f.category === cluster.category && p.visible.has(f.id));
        const tone=shades[cluster.category], center=projectPoint(cluster,c,sizeRef.current), r=cluster.radius*c.scale*center.factor;
        ctx.save();ctx.translate(center.x,center.y);ctx.rotate(cluster.tilt);ctx.scale(1,.65);
        const nebula=ctx.createRadialGradient(0,0,0,0,0,r*1.2);
        nebula.addColorStop(0,`${tone.glow}42`);nebula.addColorStop(.55,`${tone.glow}24`);nebula.addColorStop(1,`${tone.glow}00`);
        ctx.globalAlpha=shown? .85:.18;ctx.fillStyle=nebula;ctx.beginPath();ctx.ellipse(0,0,r*1.2,r,0,0,Math.PI*2);ctx.fill();
        // Sparse original spiral ink marks make the tilt legible without rigid borders.
        ctx.strokeStyle=tone.dark;ctx.lineWidth=1;ctx.globalAlpha=shown?.12:.04;
        for(let arm=0;arm<2;arm++){
          ctx.beginPath();for(let i=0;i<=80;i++){const t=i/80,angle=t*Math.PI*2.3+arm*Math.PI,rr=r*(.12+t*.85),x=Math.cos(angle)*rr,y=Math.sin(angle)*rr*.8;if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
        }
        ctx.restore();
        const label=projectPoint({x:cluster.x,y:cluster.y-cluster.radius*.82,depth:cluster.depth},c,sizeRef.current);
        ctx.globalAlpha=shown?Math.max(.55,center.factor):.25;ctx.textAlign='center';ctx.textBaseline='bottom';
        ctx.font=`600 ${Math.max(12,15*center.factor)}px "ZCOOL KuaiLe", "Microsoft YaHei", sans-serif`;ctx.fillStyle=tone.dark;ctx.fillText(`${categoryNames[cluster.category]} · ${cluster.count}`,label.x,label.y);
        ctx.font='600 9px Nunito, sans-serif';ctx.fillStyle='#A8987E';ctx.fillText(galaxyMotto[cluster.category],label.x,label.y-20);
      }
      ctx.globalAlpha=1;
      const relations = new Set(p.showRelations ? relationEdges(p.graph, p.selected, p.expanded, p.visible) : []);
      const routePairs = new Set(p.route.slice(1, Math.max(1, p.routeStep + 1)).map((id, i) => [id, p.route[i]].sort().join(':')));
      const drawingEdges = p.highlight ? [...p.graph.edges.filter(e => !([e.source, e.target].includes(p.highlight!.source) && [e.source, e.target].includes(p.highlight!.target))), p.highlight] : p.graph.edges;
      drawnEdges = [];
      for (const e of drawingEdges) {
        const inRoute = routePairs.has([e.source, e.target].sort().join(':'));
        const isDiscovery = e === p.highlight;
        const show = inRoute || isDiscovery || relations.has(e);
        if (!show || !p.visible.has(e.source) || !p.visible.has(e.target)) continue;
        const a = positions.get(e.source)!, b = positions.get(e.target)!;
        const points=Array.from({length:41},(_,i)=>{const t=i/40,u=1-t,depth=a.depth+(b.depth-a.depth)*t;return {...projectPoint({x:u*u*a.x+2*u*t*(a.x+b.x)/2+t*t*b.x,y:u*u*a.y+2*u*t*((a.y+b.y)/2-22)+t*t*b.y,depth},c,sizeRef.current),depth};});
        drawnEdges.push({edge:e,points});
        ctx.strokeStyle = isDiscovery ? '#9276AF' : inRoute ? '#BD7043' : '#A99E89'; ctx.lineWidth = inRoute || isDiscovery ? 2.8 : 1.2; ctx.setLineDash(inRoute || isDiscovery ? [8,5] : [3,5]);
        ctx.beginPath();points.forEach((point,i)=>{if(!i)ctx.moveTo(point.x,point.y);else ctx.lineTo(point.x,point.y);});ctx.stroke();
      }
      ctx.setLineDash([]);
      const visibleFoods: FoodPlanet[] = p.dataset.foods.filter(f => p.visible.has(f.id)).sort((a,b)=>positions.get(b.id)!.depth-positions.get(a.id)!.depth);
      const now = performance.now(), floating = !reduced.matches && !pointerMap.size;
      const labels: { food: FoodPlanet; x: number; y: number; radius: number; selected: boolean; hovered: boolean }[] = [];
      drawnPlanets=[];
      for (const food of visibleFoods) {
        const pos = positions.get(food.id)!;
        const projected=projectPoint(pos,c,sizeRef.current), sx=projected.x, sy=projected.y;
        if (sx < -90 || sx > width + 90 || sy < -90 || sy > height + 90) continue;
        const selected = p.selected === food.id || p.highlight?.target === food.id || p.route[p.routeStep] === food.id, isHover = hover.current === food.id;
        ctx.globalAlpha = (p.route.length && !p.route.includes(food.id) ? .35 : 1)*Math.min(1, .63+projected.factor*.34);
        const radius = (radii.current.get(food.id) ?? 30) * (selected || isHover ? 1.12 : 1);
        // A slow, per-planet bob keeps the sky alive without moving hit targets noticeably.
        const phase = (stableHash(food.id) % 628) / 100, bob = floating ? Math.sin(now / 1400 + phase) * 2.2 : 0;
        const screenRadius=radius*c.scale*projected.factor, screenY=sy+bob*c.scale*projected.factor;
        drawPlanet(ctx, food, sx, screenY, screenRadius, selected);
        drawnPlanets.push({id:food.id,x:sx,y:screenY,radius:screenRadius,depth:pos.depth});
        if (food.nutrition[p.lens] === null) { ctx.font = `${Math.max(9,16*c.scale*projected.factor)}px sans-serif`; ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.fillText('?', sx, screenY + 4); }
        labels.push({ food, x: sx, y: screenY, radius:screenRadius, selected, hovered: isHover });
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
        const lx=label.x, ly=label.y+label.radius+15;
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
      if (elapsed < 1 || cameraTween.current) requestDraw();
      else if (floating && !idle) idle = window.setTimeout(() => { idle = 0; requestDraw(); }, 33);
    }
    function fit() {
      cameraTween.current=null;
      const points = props.positions;
      if (!points.length) return;
      const {width,height}=sizeRef.current,inset=latest.current.insets?.()??{left:0,bottom:0},left=Math.min(inset.left,width*.45);
      camera.current=frameDepthPoints(points,sizeRef.current,{left,top:65,width:width-left,height:height-65-Math.min(inset.bottom,height*.22)},1);
      const scale=camera.current.scale;
      setZoom(Math.round(scale * 100)); requestDraw();
    }
    fitRef.current = fit;
    function zoomAt(factor: number, x: number, y: number) {
      cameraTween.current=null;
      const planet=[...drawnPlanets].reverse().find(p=>Math.hypot(p.x-x,p.y-y)<=p.radius+5);
      const edge=nearestEdge(x,y);
      camera.current=zoomCameraAt(camera.current,{x,y},factor,sizeRef.current,planet?.depth??edge?.depth??0);
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
    const hit = (x:number,y:number) => [...drawnPlanets].reverse().find(p=>Math.hypot(p.x-x,p.y-y)<=p.radius+5)?.id??null;
    function nearestEdge(x:number,y:number){
      let result:{edge:SimilarityEdge;depth:number}|undefined, nearest=8;
      for(const line of drawnEdges)for(let i=1;i<line.points.length;i++){
        const a=line.points[i-1],b=line.points[i],dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/length)):0;
        const distance=Math.hypot(a.x+t*dx-x,a.y+t*dy-y);
        if(distance<nearest){nearest=distance;result={edge:line.edge,depth:a.depth+(b.depth-a.depth)*t};}
      }
      return result;
    }
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
        if(!foodId)edge=nearestEdge(point.x,point.y)?.edge;
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
        const covered=width<520&&props.selected?height*.5:Math.min(bottom,height*.4);
        const nextCamera=frameDepthPoints(points,sizeRef.current,{left,top:40,width:availableWidth,height:height-covered-40},points.length===1?Math.max(.9,camera.current.scale):1.2);
        const scale=nextCamera.scale;
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
    <canvas ref={canvasRef} className="galaxy-canvas" data-scene="perspective" data-lens={props.lens} role="img" aria-label={`餐品营养星图，当前透镜：${nutrientNames[props.lens]}。请使用左侧餐品列表进行键盘探索。`}/>
    <div className="canvas-hint"><span className="tiny-orbit"/> 拖动去漫游 · 滚轮或双指缩放</div>
    <div className="zoom-tools" aria-label="画布视图控制"><button onClick={() => zoomRef.current(.8)} aria-label="缩小">−</button><span>{zoom}%</span><button onClick={() => zoomRef.current(1.25)} aria-label="放大">+</button><i/><button onClick={() => fitRef.current()} aria-label="重置视图"><Icon name="reset" size={17}/></button></div>
  </>;
}
