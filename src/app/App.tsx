import { useEffect, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router';
import { RepositoryBoundary, useFood } from '../state/FoodProvider';
import { Icon, Star } from '../components/Illustrations';
import { Modal } from '../components/Modal';
import ObservatoryPage from '../pages/ObservatoryPage';
import GalaxyPage from '../pages/GalaxyPage';
import AtlasPage from '../pages/AtlasPage';
import LabPage from '../pages/LabPage';
import QuestsPage from '../pages/QuestsPage';

const navigation=[['/','宇宙观测站'],['/galaxy','营养星系'],['/atlas','星球图鉴'],['/lab','营养实验室'],['/quests','探索任务']] as const;
function GlobalSearch(){
  const {dataset,path}=useFood();const navigate=useNavigate();const [query,setQuery]=useState(''),[open,setOpen]=useState(false);
  const results=query.trim()?dataset.foods.filter(f=>f.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).slice(0,6):[];
  function choose(id:string){navigate(path('/atlas',{food:id}));setOpen(false);setQuery('');}
  return <div className="global-search"><label><Icon name="search" size={17}/><input aria-label="全局搜索餐品" placeholder="寻找一颗餐品星球" value={query} autoComplete="off" aria-expanded={open&&!!query.trim()} aria-controls="global-food-results" onFocus={()=>setOpen(true)} onChange={e=>{setQuery(e.target.value);setOpen(true);}} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);setQuery('');}if(e.key==='Enter'&&results[0])choose(results[0].id);}}/></label>{open&&query.trim()&&<div id="global-food-results" className="global-suggestions"><div className="suggestion-heading">{results.length?'选择一颗星球，打开它的档案':'没有匹配的餐品，换个关键词试试'}</div>{results.map(f=><button key={f.id} onClick={()=>choose(f.id)}>{f.name}<span>↗</span></button>)}<button className="close-suggestions" onClick={()=>setOpen(false)}>收起搜索建议</button></div>}</div>;
}
function AppShell(){
  const {dataset,state,notice,storageWarning,path}=useFood();const [sourceOpen,setSourceOpen]=useState(false);const location=useLocation();const navigate=useNavigate();
  const official=dataset.meta.mode==='official-snapshot';
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});const page=navigation.find(([href])=>href===location.pathname);document.title=`${page?.[1]??'迷路了'} · McCosmos 麦门星图`;},[location.pathname]);
  return <>
    <header className="site-header upgrade-header"><Link className="brand" to={path('/')} aria-label="McCosmos 麦门星图首页"><Star/><div><strong>McCosmos<span>麦门星图</span></strong><small>A LITTLE FOOD UNIVERSE</small></div></Link><span className="edition">VOL. 02 · 探索手帐</span><nav aria-label="主导航">{navigation.map(([href,title],i)=><NavLink key={href} end={href==='/'} to={path(href)} className={({isActive})=>isActive?'nav-current':''}><small>0{i+1}</small>{title}{href==='/lab'&&state.labSelectedIds.length>0&&<b>{state.labSelectedIds.length}</b>}</NavLink>)}</nav></header>
    <div className="app-toolbar"><GlobalSearch/><button className={`global-source ${official?'':'is-demo'}`} onClick={()=>setSourceOpen(true)} aria-label="查看全局数据来源"><i/>{official?'官方营养快照':'合成示例数据 · 非官方营养信息'}<span>{dataset.meta.fetchedAt?new Date(dataset.meta.fetchedAt).toLocaleString('zh-CN',{hour12:false}):'显式演示模式'} · v{dataset.meta.schemaVersion}</span><Icon name="info" size={15}/></button></div>
    <Routes><Route path="/" element={<ObservatoryPage/>}/><Route path="/galaxy" element={<GalaxyPage/>}/><Route path="/atlas" element={<AtlasPage/>}/><Route path="/lab" element={<LabPage/>}/><Route path="/quests" element={<QuestsPage/>}/><Route path="*" element={<main className="empty-state paper"><h1>这条航道还没有记录</h1><p>从观测站重新出发，或搜索一颗餐品星球。</p><Link className="button primary" to={path('/')}>返回宇宙观测站</Link></main>}/></Routes>
    <div className="live-feedback" role="status" aria-live="polite">{notice}</div>{storageWarning&&<p className="storage-warning" role="status">{storageWarning}</p>}
    <footer className="site-footer"><span><Star/> 好奇心，是最好的宇宙飞船。</span><p>独立参赛作品 · 营养信息以官方渠道为准。收藏、实验台和任务仅存于当前浏览器，清除数据后消失。</p><a href="https://github.com/ayingQAQ/McCosmos" target="_blank" rel="noreferrer">项目手记 ↗</a></footer>
    {sourceOpen&&<Modal title="数据来源与探索边界" onClose={()=>setSourceOpen(false)}><div className="about-content"><h3>{official?'官方营养快照':'合成示例数据 · 非官方营养信息'}</h3><p>{dataset.meta.source}</p><p>获取时间：{dataset.meta.fetchedAt??'不适用（合成示例）'}<br/>原始 {dataset.meta.rawCount} 条 · 当前 {dataset.foods.length} 条 · 数据结构 v{dataset.meta.schemaVersion} · 算法 v{dataset.meta.algorithmVersion}</p><p>类别由餐品名称本地推断；官方接口没有明确部分单位和计量基准，所以保留原始值，不声称每份或每 100 克。相近度和航线是数据模型下的探索，不是健康评分、进食或医疗建议。</p><ul>{dataset.warnings.map(w=><li key={w}>{w}</li>)}</ul><p>原创餐品插画为通用示意，非商品配方或官方包装复刻。浏览器只读取公开快照，不访问 Token。</p><button className="button primary" onClick={()=>{navigate(`${location.pathname}${official?'?demo=1':''}`);setSourceOpen(false);}}>{official?'切换到合成演示':'读取官方快照'}</button></div></Modal>}
  </>;
}
export default function App(){return <BrowserRouter><div className="app"><RepositoryBoundary>{()=> <AppShell/>}</RepositoryBoundary></div></BrowserRouter>;}
