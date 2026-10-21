import { McBrandTab } from '../components/McBrand';
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useFood } from '../state/FoodProvider';
import { formatNutrient, type FoodPlanet } from '../data/schema';
import { compareNutrition } from '../core/comparison';
import { compareFoods, normalizeFoods } from '../graph/analysis';
import { FoodIllustration, resolveFoodIllustration } from '../components/food-illustrations';
import { exportExplorationCard } from '../art/explorationCards';

const signed = (value: number) => `${value > 0 ? '+' : ''}${Number(value.toFixed(2))}`;
export default function LabPage() {
  const { dataset, state, foodById, addToLab, removeFromLab, clearLab, swapLab, path, notify } = useFood();
  const [query, setQuery] = useState(''), [replaceId, setReplaceId] = useState(''), [exporting, setExporting] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const focusSearch = () => requestAnimationFrame(() => { search.current?.focus({ preventScroll: true }); search.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  const selected = state.labSelectedIds.flatMap(id => { const food = foodById.get(id); return food ? [food] : []; });
  const rows = compareNutrition(selected);
  const normalized = useMemo(() => normalizeFoods(dataset.foods), [dataset]);
  const similarity = selected.length >= 2 ? compareFoods(selected[0], selected[1], normalized) : null;
  // With an empty search, offer the explorer's own favorites and recent planets as one-tap samples.
  const quickPicks = [...new Set([...state.favoriteIds, ...state.recentlyViewed])].filter(id => !state.labSelectedIds.includes(id)).flatMap(id => { const food = foodById.get(id); return food ? [food] : []; }).slice(0, 8);
  const canAdd = selected.length < 3 || !!replaceId;
  function pick(id: string) { addToLab(id, replaceId || undefined); setReplaceId(''); setQuery(''); }
  const results = dataset.foods.filter(food => food.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) && !state.labSelectedIds.includes(food.id));
  const source = `${dataset.meta.mode === 'synthetic-demo' ? '演示数据（非官方）' : '官方数据快照'} · ${dataset.meta.source} · ${dataset.meta.fetchedAt ?? '获取时间未提供'}`;
  function difference(food: FoodPlanet, first: FoodPlanet, index: number) {
    const row = compareNutrition([first, food])[index];
    return row.delta === null ? '无法比较（缺失或单位口径不同）' : `${signed(row.delta)} ${row.unit}`;
  }
  async function download() {
    setExporting(true);
    try {
      await exportExplorationCard('mccosmos-comparison.png', '星球对照卡', [
        ...selected.map((food, index) => `${index + 1}. ${food.name}`),
        ...rows.flatMap((row, index) => [`${row.label}：${selected.map(food => formatNutrient(food, row.key)).join(' / ')}`, `第 2 项 − 第 1 项：${difference(selected[1], selected[0], index)}${selected[2] ? `；第 3 项 − 第 1 项：${difference(selected[2], selected[0], index)}` : ''}`]),
        `营养轮廓相似度：${similarity ? similarity.score.toFixed(1) : '不可计算'}`, source,
        `导出时间：${new Date().toLocaleString()}`,
        '未核实单位按原始值显示；每份口径以来源说明为准；缺失不补零。',
        '独立探索项目，非官方产品；营养相似度不是健康评分。插画为通用示意。',
      ], selected);
      notify('星球对照卡已导出为 PNG');
    } catch { notify('无法导出 PNG，请检查浏览器下载设置后重试。'); }
    finally { setExporting(false); }
  }
  return <main className="lab-page page-section">
    <header className="page-heading"><McBrandTab/><p className="eyebrow">SMALL EXPERIMENTS / 04</p><h1>营养实验室</h1><p>摆好两颗星球，看看它们真实的数字差异。最多放入三颗。</p></header>
    <section className="lab-workbench paper" aria-label="餐品实验台"><div className="lab-slots">{[0, 1, 2].map(index => {
      const food = selected[index];
      return <article key={index} className={`lab-slot${food && replaceId === food.id ? ' is-replacing' : ''}`}><p className="eyebrow">SAMPLE {String(index + 1).padStart(2, '0')}</p>{food ? <><FoodIllustration foodId={resolveFoodIllustration(food).presetId} size={100} cosmic decorative/><h2>{food.name}</h2><p>{formatNutrient(food, 'kcal')}</p><button className="button" aria-pressed={replaceId === food.id} onClick={() => { const next = replaceId === food.id ? '' : food.id; setReplaceId(next); if (next) focusSearch(); }}>替换第 {index + 1} 项</button><button className="button" aria-label={`移除 ${food.name}`} onClick={() => { removeFromLab(food.id); if (replaceId === food.id) setReplaceId(''); }}>移除</button><Link to={path('/atlas', {food: food.id})}>查看档案</Link></> : <button className="lab-slot-empty" onClick={focusSearch}><span aria-hidden="true">＋</span><h2>等待一颗星球</h2><p>点这里搜索，或从图鉴加入餐品。</p></button>}</article>;
    })}</div><div className="lab-actions"><button className="button" disabled={selected.length < 2} onClick={swapLab}>交换前两项</button><button className="button" disabled={!selected.length} onClick={() => { clearLab(); setReplaceId(''); }}>清空实验台</button><span>{selected.length} / 3 个槽位</span></div></section>
    <section className="lab-search paper"><h2>添加实验样本</h2><label>搜索餐品<input ref={search} type="search" aria-label="实验室搜索" placeholder="输入餐品名称" value={query} onChange={event => setQuery(event.target.value)}/></label>{replaceId && foodById.has(replaceId) && <p className="lab-replacing" role="status">正在替换「{foodById.get(replaceId)!.name}」，从下方选一颗新星球<button className="button" onClick={() => setReplaceId('')}>取消替换</button></p>}{selected.length === 3 && !replaceId && <p role="status">实验台已满，请先选择上方一个槽位替换，或移除一项。</p>}
      {!query.trim() && quickPicks.length > 0 && <div className="lab-quick" aria-label="收藏与最近查看"><span>收藏与最近查看</span>{quickPicks.map(food => <button key={food.id} className="chip" disabled={!canAdd} onClick={() => pick(food.id)}>＋ {food.name}</button>)}</div>}
      {query.trim() && <div className="lab-results">{results.slice(0, 12).map(food => <div className="lab-result" key={food.id}><span>{food.name} · {formatNutrient(food, 'kcal')}</span><button className="button" disabled={selected.length >= 3 && !selected.some(item => item.id === replaceId)} aria-label={`${replaceId ? '替换为' : '添加'} ${food.name}`} onClick={() => { addToLab(food.id, replaceId || undefined); setReplaceId(''); setQuery(''); }}>{replaceId ? '替换为此项' : '加入实验台'}</button></div>)}{!results.length && <p className="empty-state">没有可添加的结果，请换一个名称。</p>}{results.length > 12 && <p>显示前 12 项，请输入更完整的名称。</p>}</div>}
    </section>
    {selected.length < 2 ? <section className="empty-state paper"><h2>还差{2 - selected.length}颗星球，就能开始比较</h2><p>上方搜索加入餐品，或翻开图鉴选择你的样本。</p><Link className="button" to={path('/atlas')}>去图鉴找星球</Link></section> : <section className="lab-comparison paper"><h2>营养观察记录</h2><p>每行采用独立量尺（0 至该行最大原始值），不可跨行比较条形长度。所有差值均以第一项为基准。</p><div className="lab-comparison-head">{selected.map((food, index) => <span key={food.id}>{index + 1}. {food.name}</span>)}</div>{rows.map((row, index) => {
      const max = Math.max(0, ...row.values.flatMap(value => value === null ? [] : [value]));
      const units = selected.map(food => row.key === 'kcal' ? 'kcal' : food.basis.unitsVerified ? row.key === 'sodiumMg' ? 'mg' : 'g' : '原始值');
      const sameUnit = units.every(unit => unit === units[0]);
      return <div data-testid="comparison-row" className="lab-comparison-row" key={row.key}><h3>{row.label}</h3><div className="lab-values">{selected.map((food, foodIndex) => <div className="lab-value" key={food.id}><span>{food.name}</span><strong>{formatNutrient(food, row.key)}</strong>{row.values[foodIndex] !== null && sameUnit ? <progress className="lab-bar" aria-label={`${food.name} ${row.label}`} max={max || 1} value={row.values[foodIndex]!}/> : <small>{row.values[foodIndex] === null ? '缺失，不绘制条形' : '单位口径不同，不绘制共同量尺'}</small>}</div>)}</div><p>第 2 项 − 第 1 项：{difference(selected[1], selected[0], index)}</p>{selected[2] && <p>第 3 项 − 第 1 项：{difference(selected[2], selected[0], index)}</p>}</div>;
    })}<div className="lab-similarity"><h3>营养轮廓相似度</h3><p>{similarity ? `${similarity.score.toFixed(1)} / 100 · 可比 ${similarity.comparableKeys.length} / 5 项指标` : '有效共同指标不足三项，无法计算相似度。'}</p><details><summary>这个数字如何得到？</summary><p>在完整当前数据集中对五项指标进行 log1p 和 5%–95% 分位标准化，再计算加权距离与指数相似度。此结果描述数值轮廓，不是健康评分；未核实单位仍为原始值。</p></details></div><div className="lab-actions"><Link className="button primary" to={path('/galaxy', {from: selected[0].id, to: selected[1].id})}>在星系中查看关系</Link><button className="button" disabled={exporting} onClick={download}>{exporting ? '正在绘制对照卡…' : '导出星球对照卡 PNG'}</button></div></section>}
    <aside className="lab-notes"><p>{source}</p><p>未核实单位显示「原始值」，不推定为 g 或 mg；每份口径以原始来源为准。插画为通用示意，独立项目不代表官方；实验台仅保存在当前浏览器。</p></aside>
  </main>;
}
