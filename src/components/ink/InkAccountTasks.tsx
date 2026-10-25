import type { LifeGameState } from '@interfaces/lifeEngine';
import { DAILY_TASKS, GROWTH_GUIDES, dailyProgress } from '@core/life/accountEconomy';
import { DAILY_TASK_JADE, GUIDE_MAJOR_JADE, GUIDE_STEP_JADE } from '@data/redesign/martialEconomyParams';
import { useAncestryStore } from '../../store/ancestryStore';
import { GachaSheet } from './InkGachaReveal';

/** 日常及成長引導獨立內容區；主頁只保留一個入口。 */
export function InkAccountTasks({state,onClose}:{state:LifeGameState;onClose:()=>void}) {
  const meta=useAncestryStore(s=>s.meta),select=useAncestryStore(s=>s.selectDaily),claim=useAncestryStore(s=>s.claimDaily),guide=useAncestryStore(s=>s.claimGuide);
  const e=meta.economy,d=e?.daily;
  return <GachaSheet title="日常與成長" onClose={onClose}>
    <h4>江湖日常 · 已領{d?.claimed.length??0}／3</h4>
    <p>每日自選三項，每項{DAILY_TASK_JADE}免費玉石。香港時間凌晨四時更新，已領項目保留名額。</p>
    <ul className="ink-account-tasks">{DAILY_TASKS.map(t=>{
      const progress=Math.min(t.target,dailyProgress(e,t.id)),selected=d?.selected.includes(t.id),done=d?.claimed.includes(t.id);
      return <li key={t.id}><div><strong>{t.name}</strong><p>{t.detail} · {progress}／{t.target}</p></div>
        <button className="ink-btn ink-btn--quiet" type="button" aria-pressed={Boolean(selected)} disabled={done||(!selected&&(d?.selected.length??0)>=3)} onClick={()=>select(t.id)}>{done?'已領':selected?'已選':'選擇'}</button>
        <button className="ink-btn ink-btn--primary" type="button" disabled={!selected||done||progress<t.target} onClick={()=>claim(t.id)}>領取{DAILY_TASK_JADE}</button></li>;
    })}</ul>
    <h4>成長引導 · 帳戶首次獎勵</h4><p>一般步驟{GUIDE_STEP_JADE}、重要節點{GUIDE_MAJOR_JADE}免費玉石，另計於日常獎勵之外。</p>
    <ul className="ink-account-tasks">{GROWTH_GUIDES.map(g=>{
      const done=e?.guides.includes(g.id),ready=g.done(state);
      return <li key={g.id}><div><strong>{g.name}</strong><p>{g.detail}</p></div><button className="ink-btn ink-btn--quiet" type="button" disabled={done||!ready} onClick={()=>guide(g.id)}>{done?'已領取':ready?`領取${g.major?GUIDE_MAJOR_JADE:GUIDE_STEP_JADE}`:'未完成'}</button></li>;
    })}</ul>
  </GachaSheet>;
}
