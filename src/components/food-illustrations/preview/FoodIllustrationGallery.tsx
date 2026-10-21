import { useState } from 'react';
import { FoodIllustration } from '../FoodIllustration';
import { foodPresets } from '../presets/foods';
import { getFoodIllustrationPreset } from '../registry';
import { downloadFoodIllustrationSvg } from '../exportSvg';
import type { Expression, FoodFamily } from '../types';

const familyNames: Record<FoodFamily, string> = { burger: '汉堡', fries: '薯条', drink: '饮品', nugget: '鸡块小食', dessert: '甜品', breakfast: '早餐', wrap: '卷饼', unknown: '未知餐品' };
const expressionNames: Record<Expression, string> = { happy: '开心', smile: '眯眼微笑', curious: '好奇', sleepy: '慵懒', excited: '兴奋', shy: '害羞', neutral: '不加表情' };
export function FoodIllustrationGallery() {
  const [family, setFamily] = useState<FoodFamily | 'all'>('all'), [selected, setSelected] = useState('burger-double');
  const [size, setSize] = useState(160), [expression, setExpression] = useState<Expression | ''>('');
  const [cosmic, setCosmic] = useState(false), [animated, setAnimated] = useState(false), [background, setBackground] = useState('checker');
  const [exporting, setExporting] = useState(false), [error, setError] = useState('');
  const active = getFoodIllustrationPreset(selected);
  const visible = foodPresets.filter(preset => family === 'all' || preset.family === family);
  async function save() {
    setExporting(true); setError('');
    try { await downloadFoodIllustrationSvg({ foodId: selected, size, expression: expression || undefined, cosmic }); }
    catch { setError('SVG导出失败，请重试。'); }
    finally { setExporting(false); }
  }
  return <main className="food-workshop">
    <header className="workshop-header"><div><span>McCOSMOS / ORIGINAL SVG ATELIER</span><h1>餐品贴纸工坊 <b>✧</b></h1><p>像翻开一本小食物图鉴。先看食物，再看它的小性格。</p></div><a href="./">返回麦门星图 ↗</a></header>
    <div className="workshop-notice"><strong>{foodPresets.length} 份原创通用示例</strong><span>全部为组合母版，真实餐品配方映射：未认证。造型不依据营养数据推断。</span><span>透明SVG · 无远程素材 · 无运行时AI</span></div>
    <section className="workshop-controls" aria-label="插画预览设置">
      <label>食物类别<select aria-label="食物类别" value={family} onChange={event => { const next = event.target.value as FoodFamily | 'all'; setFamily(next); if (next !== 'all') setSelected(foodPresets.find(p => p.family === next)!.id); }}><option value="all">全部母版</option>{Object.entries(familyNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label>插画尺寸<select aria-label="插画尺寸" value={size} onChange={event => setSize(Number(event.target.value))}>{[48, 64, 96, 128, 160, 256].map(value => <option key={value} value={value}>{value} px</option>)}</select></label>
      <label>角色表情<select aria-label="角色表情" value={expression} onChange={event => setExpression(event.target.value as Expression | '')}><option value="">跟随 Preset</option>{Object.entries(expressionNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label className="workshop-check"><input type="checkbox" checked={cosmic} onChange={event => setCosmic(event.target.checked)}/>宇宙角色模式</label>
      <label className="workshop-check"><input type="checkbox" checked={animated} onChange={event => setAnimated(event.target.checked)}/>仅选中项轻动效</label>
      <fieldset><legend>预览背景</legend>{[['light', '浅色'], ['dark', '深色'], ['checker', '透明棋盘']].map(([id, name]) => <button key={id} aria-pressed={background === id} onClick={() => setBackground(id)}>{name}</button>)}</fieldset>
    </section>
    <div className="workshop-layout"><section className="food-art-grid" aria-label="全部插画">
      {visible.map(preset => <article key={preset.id} className={`food-art-tile ${selected === preset.id ? 'is-selected' : ''}`}>
        <button className={`food-art-stage stage-${background}`} aria-label={`查看 ${preset.name}`} onClick={() => setSelected(preset.id)}><FoodIllustration foodId={preset.id} size={size} expression={expression || undefined} cosmic={cosmic} animated={animated && selected === preset.id}/></button>
        <div className="food-art-caption"><span>{familyNames[preset.family]} <i/> {cosmic ? '宇宙模式' : '普通模式'}</span><h2>{preset.name}</h2><code>{preset.id}</code><small>通用示例 · 非真实配方映射</small></div>
      </article>)}
    </section>
    <aside className="workshop-inspector" aria-label="选中插画"><div className="inspector-top"><span>STICKER FIELD NOTES</span><small>{foodPresets.findIndex(p => p.id === selected) + 1} / {foodPresets.length}</small></div>
      <div className={`inspector-art stage-${background}`}><FoodIllustration foodId={selected} size={256} expression={expression || undefined} cosmic={cosmic} animated={animated}/></div>
      <h2>{active.name}</h2><p>{active.notes}</p>
      <label>选择变体<select aria-label="选择变体" value={selected} onChange={event => setSelected(event.target.value)}>{foodPresets.map(p => <option key={p.id} value={p.id}>{p.name} / {p.variant}</option>)}</select></label>
      <dl><div><dt>母版</dt><dd>{active.family}</dd></div><div><dt>变体</dt><dd>{active.variant}</dd></div><div><dt>真实商品映射</dt><dd>否 · 通用示例</dd></div><div><dt>构图种子</dt><dd>{active.layoutSeed}</dd></div></dl>
      <button className="export-food-button" disabled={exporting} onClick={save}>{exporting ? '正在打包SVG…' : '导出独立 SVG'} <span>↗</span></button>
      {error && <p role="alert">{error}</p>}<p className="export-note">导出尺寸 {size} × {size}，默认透明背景。导出为静态图形，包含全部绘制路径，不依赖本页面、字体服务或React。</p>
      <pre><code>{`<FoodIllustration\n  foodId="${selected}"\n  size={${size}}\n  cosmic={${cosmic}}\n  animated={false}\n/>`}</code></pre>
    </aside></div><footer className="workshop-footer">McCosmos 原创餐品插画系统 · 160 × 160 统一坐标 · 固定种子与共用食材组件<span>手绘线条参考 Rough.js / Wired Elements / PaperCSS，造型与组合原创。</span></footer>
  </main>;
}
