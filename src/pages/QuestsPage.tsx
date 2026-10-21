import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useFood } from '../state/FoodProvider';
import type { DailyQuest } from '../core/quests';
import { formatNutrient } from '../data/schema';
import { FoodIllustration, resolveFoodIllustration } from '../components/food-illustrations';
import { exportExplorationCard } from '../art/explorationCards';

const statusText = {notstarted: '未开始', started: '进行中', completed: '已完成 · 待领取', claimed: '已领取星章'};
async function playStamp() {
  try {
    const audio = new AudioContext();
    try {
      await audio.resume();
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(660, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audio.currentTime + .1);
      gain.gain.setValueAtTime(.05, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .18);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .2);
      oscillator.onended = () => { void audio.close().catch(() => undefined); };
    } catch { await audio.close().catch(() => undefined); }
  } catch { /* Sound is optional; claiming remains available. */ }
}
function QuestCard({ quest, index }: {quest: DailyQuest; index: number}) {
  const { dataset, foodById, state, checkQuest, setQuestStatus, path, notify,quests } = useFood();
  const [clue, setClue] = useState(false), [first, setFirst] = useState(''), [second, setSecond] = useState(''), [feedback, setFeedback] = useState('');
  const status = Object.hasOwn(state.questProgress, quest.id) ? state.questProgress[quest.id] : 'notstarted';
  const finished = status === 'completed' || status === 'claimed';
  const nextQuest=quests.find(item=>item.available&&item.id!==quest.id&&state.questProgress[item.id]!=='claimed');
  const previewId = quest.type === 'route' ? quest.pair?.[0] : first || quest.pair?.[0];
  const preview = previewId ? foodById.get(previewId) : undefined;
  function check() {
    const valid = checkQuest(quest.id, quest.type === 'twins' ? [first, second] : [first]);
    const food = foodById.get(first);
    setFeedback(valid ? `探索成功！${quest.type === 'nutrient' && quest.nutrient && food ? `${food.name}：${formatNutrient(food, quest.nutrient)}。` : ''}现在可以领取星章。` : '还不符合任务条件，请查看线索，再选择一次。');
  }
  function claim() {
    if (status !== 'completed') return;
    setQuestStatus(quest.id, 'claimed'); setFeedback('星章已收进今日手帐，重复领取不会增加数量。'); notify('已领取一枚今日星章');
    if (state.sound) void playStamp();
  }
  const options = <><option value="">请选择一颗星球</option>{dataset.foods.map(food => <option key={food.id} value={food.id}>{food.name}</option>)}</>;
  return <article id={`mission-${quest.type}`} className={`quest-card paper quest-${status}`} aria-labelledby={`quest-title-${index}`}>
    <div className="quest-card-heading"><p className="eyebrow">MISSION {String(index + 1).padStart(2, '0')}</p><span className="quest-status">{quest.available ? statusText[status] : '暂不可用'}</span></div>
    {preview && <FoodIllustration foodId={resolveFoodIllustration(preview).presetId} cosmic size={96} decorative/>}
    <h2 id={`quest-title-${index}`}>{quest.title}</h2><p>{quest.description}</p>
    {!quest.available ? <p className="quest-unavailable">当前数据不足，暂时无法生成可完成的任务。切换数据集或更新快照后再来看看。</p> : <>
      {status === 'notstarted' && <button className="button primary" onClick={() => setQuestStatus(quest.id, 'started')}>开始任务</button>}
      <button className="button" aria-expanded={clue} aria-controls={`quest-clue-${index}`} onClick={() => setClue(value => !value)}>{clue ? '收起线索' : '查看线索'}</button>
      {clue && <p className="quest-clue" id={`quest-clue-${index}`}>{quest.clue}</p>}
      {status !== 'notstarted' && !finished && quest.type !== 'route' && <div className="quest-answer"><label>{quest.type === 'twins' ? '双生星第一颗' : '营养星候选'}<select aria-label={quest.type === 'twins' ? '双生星第一颗' : '营养星候选'} value={first} onChange={event => setFirst(event.target.value)}>{options}</select></label>{quest.type === 'twins' && <label>双生星第二颗<select aria-label="双生星第二颗" value={second} onChange={event => setSecond(event.target.value)}>{options}</select></label>}<button className="button primary" disabled={!first || quest.type === 'twins' && (!second || first === second)} onClick={check}>验证发现</button></div>}
      {quest.type === 'route' && quest.pair && <div className="quest-route"><p>指定航线：{foodById.get(quest.pair[0])?.name} → {foodById.get(quest.pair[1])?.name}</p><p>进入星系后点击「规划航线」，得到有效路线才会完成任务。</p><Link className="button" to={path('/galaxy', {from: quest.pair[0], to: quest.pair[1]})} onClick={() => { if (status === 'notstarted') setQuestStatus(quest.id, 'started'); }}>前往规划航线</Link></div>}
      {status === 'completed' && <button className="button primary quest-claim" onClick={claim}>领取星章</button>}
      {status === 'claimed' && <button className="button quest-stamp" disabled>星章已领取</button>}
      {status==='claimed'&&(nextQuest?<Link className="text-link quest-next" to={path('/quests',{quest:nextQuest.id})} onClick={()=>{if(!state.questProgress[nextQuest.id])setQuestStatus(nextQuest.id,'started');}}>继续下一项发现 ↗</Link>:<Link className="text-link quest-next" to={path('/')}>回观测站记录足迹 ↗</Link>)}
      {finished && <p className="quest-success">{status === 'claimed' ? '今日探索已记录。明天再来寻找新发现。' : '任务验证已通过，领取星章将其记入今日成果。'}</p>}
      {feedback && <p className="quest-feedback" role="status">{feedback}</p>}
    </>}
  </article>;
}

export default function QuestsPage() {
  const { quests, date, state, dataset, setSound, path, notify, foodById } = useFood();
  const [params]=useSearchParams();const targetId=params.get('quest');
  useEffect(()=>{const target=quests.find(quest=>quest.id===targetId);if(target)document.getElementById(`mission-${target.type}`)?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});},[targetId,quests]);
  const [exporting, setExporting] = useState(false);
  const claimed = quests.filter(quest => quest.available && state.questProgress[quest.id] === 'claimed').length;
  const available = quests.filter(quest => quest.available).length;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  async function share() {
    setExporting(true);
    try {
      const preview = quests.flatMap(quest => quest.pair?.slice(0, 1) ?? []).flatMap(id => { const food = foodById.get(id); return food ? [food] : []; }).slice(0, 3);
      await exportExplorationCard(`mccosmos-exploration-${date}.png`, '今日星际探索手帐', [
        `本地日期：${date} · ${timezone}`,
        `今日已领取 ${claimed} 枚星章 / ${available} 项可用任务`,
        ...quests.map(quest => `${quest.title}：${quest.available ? statusText[state.questProgress[quest.id] ?? 'notstarted'] : '当前数据不足，暂不可用'}`),
        `${dataset.meta.mode === 'synthetic-demo' ? '演示数据（非官方）' : '官方数据快照'} · ${dataset.meta.source}`,
        `快照获取时间：${dataset.meta.fetchedAt ?? '未提供'}`,
        `导出时间：${new Date().toLocaleString()}`,
        '进度仅保存在当前浏览器；成果来自当前数据集的真实任务验证。',
        '未核实单位按原始值显示，缺失不补零。独立项目，非官方产品。',
        '营养相似度不是健康评分；通用食物插画不代表实际商品配方。',
      ], preview);
      notify('今日探索成果已导出为 PNG');
    } catch { notify('暂时无法导出成果卡，请检查浏览器下载设置后重试。'); }
    finally { setExporting(false); }
  }
  return <main className="quest-page page-section"><header className="page-heading"><p className="eyebrow">A LITTLE DISCOVERY / 05</p><h1>星际探索任务</h1><p>带着三个小问题出发。每一次发现，都由当前星图的真实数据验证。</p></header>
    <section className="quest-journal paper"><div><p className="eyebrow">TODAY'S EXPLORATION</p><h2>今日已得 {claimed} 枚星章</h2><p>{date} · 本地时区 {timezone}</p><p>当前有 {available} 项可用任务；完成后领取才计入星章，同一任务只能领取一次。</p></div><div className="quest-actions"><label><input type="checkbox" checked={state.sound} onChange={event => setSound(event.target.checked)}/>领取时播放短音效</label><button className="button" disabled={exporting} onClick={share}>{exporting ? '正在绘制成果卡…' : '分享今日成果 PNG'}</button><Link className="button" to={path('/galaxy')}>返回星图</Link><Link className="button" to={path('/atlas')}>翻开星球图鉴</Link></div></section>
    <div className="quest-grid">{quests.map((quest, index) => <QuestCard key={quest.id} quest={quest} index={index}/>)}</div>
    <aside className="quest-notes"><p>任务按本地日期和当前数据版本固定生成；日期或数据版本改变会产生新任务。收藏与探索进度仅保存在当前浏览器，清除浏览器数据后会消失。</p><p>{dataset.meta.mode === 'synthetic-demo' ? '演示数据（非官方）' : '官方数据快照'} · {dataset.meta.source} · {dataset.meta.fetchedAt ?? '获取时间未提供'}。未核实单位仅按原始值比较，不作健康判断。</p></aside>
  </main>;
}
