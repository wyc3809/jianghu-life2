import { useEffect, useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { natureKeys, natureLabels, wuxiaAttributeKeys, wuxiaAttributeLabels } from '@interfaces/lifeEngine';
import { getGearDef } from '@data/equipment/catalog';
import { displayGearName } from '@data/equipment/affixes';
import { currentCultivationTier } from '@core/life/cultivation';
import { combatRating } from '@core/life/combatRating';
import { jianghuRank, JIANGHU_RANK_START } from '@core/life/jianghuRank';
import { ensureNature } from '@core/life/nature';
import { EQUIPMENT_SLOTS, EQUIPMENT_LABEL, equipmentArtUrl } from '../../ui/personEquipment';
import { InkBadge } from './InkBadge';
import { InkBrushBar, clampPct } from './InkBrush';
import { InkIcon } from './InkIcon';
import { InkEquipmentPicker } from './InkEquipmentPicker';
import { InkPersonSheet } from './InkPersonSheet';
import { newbieGuide } from '@core/life/newbieGuide';
import { useLifeStore } from '../../store/lifeStore';
import { InkNewbieGuide } from './InkNewbieGuide';
import { useOnceCoach } from '../../ui/useOnceCoach';
import type { PersonView } from './InkPersonPanel';
import './person-screen.css';
import { AppearanceCanvas, AppearanceBadge, InkAppearancePicker } from './InkAppearance';
import { appearanceOf } from '@interfaces/appearance';

/** 人物與三類裝備同頁，數值直讀現行配搭；更多只收納次級資料。 */
export function InkPersonOverview({ state, preset, busy, onPreset, onEquip, onView, onBack, onStats, onBest }: {
  state: LifeGameState; preset: 'normal' | 'duel'; busy: boolean; onPreset: (preset: 'normal' | 'duel') => void;
  onEquip: (id: string) => boolean; onView: (view: PersonView) => void; onBack: () => void; onStats: () => void; onBest: () => void;
}) {
  const c = state.character, nature = ensureNature(c), rank = jianghuRank(state);
  const [slot, setSlot] = useState<(typeof EQUIPMENT_SLOTS)[number] | null>(null), [more, setMore] = useState(false);
  const [notice, setNotice] = useState('');
  const [appearanceOpen,setAppearanceOpen]=useState(false);
  const setAppearance=useLifeStore(s=>s.setAppearance);
  const guide = preset === 'normal' ? newbieGuide(state) : null;
  const showGuide = useOnceCoach(state, guide && guide.step !== 'trial' ? guide.step === 'equip' ? 'equip_person' : 'ready' : null);
  const dismiss = useLifeStore(s => s.dismissCoach);
  useEffect(() => {if(!notice)return;const timer=window.setTimeout(()=>setNotice(''),2400);return()=>window.clearTimeout(timer);},[notice]);
  const entries: { view: PersonView; label: string }[] = [
    {view:'overview',label:'修行詳情'}, {view:'cultivation',label:'境界與傳承'}, {view:'combat',label:'戰力詳解'},
    {view:'attrs',label:'屬性與心性詳解'}, {view:'gear',label:'裝備與詞綴'}, {view:'genealogy',label:'族譜'},
    {view:'people',label:'人際'}, {view:'achievements',label:'成就'}, {view:'roots',label:'江湖根腳'},
  ];
  return <section className="ink-person-overview" aria-label="人物與裝備" data-equipment-open={slot !== null}>
    <header className="ink-person-top"><button type="button" aria-label="返回鎮居" onClick={onBack}>返回</button><h2>人物</h2><span /></header>
    <div className="ink-person-identity"><div><h3>{c.name}</h3><p>{currentCultivationTier(state).name}</p></div><div className="ink-person-presets" role="tablist" aria-label="配搭方案">{(['normal','duel'] as const).map(kind => <button key={kind} type="button" role="tab" aria-selected={preset === kind} onClick={() => {onPreset(kind);setNotice('');}}>{kind === 'normal' ? '普通配搭' : '對戰配搭'}</button>)}</div></div>
    <div className="ink-person-summary"><div><span>總戰力</span><strong>{combatRating(state).toLocaleString('zh-Hant')}</strong></div><div><span>江湖排名</span><strong>{rank >= JIANGHU_RANK_START ? '未列名' : rank.toLocaleString('zh-Hant')}</strong></div></div>
    {showGuide && guide && guide.step !== 'trial' && <InkNewbieGuide title={guide.title} onDismiss={dismiss}
      action={guide.step === 'ready' ? <button type="button" onClick={onBack}>返回鎮居</button> : undefined}>
      {guide.step === 'equip' ? '點左側武器欄，選擇兵器查看比較。' : guide.body}
    </InkNewbieGuide>}
    <div className="ink-person-stage">
      <AppearanceCanvas className="ink-person-seated-hero" appearance={appearanceOf(c)} pose="seated" label="盤坐調息的人物造型"/>
      {EQUIPMENT_SLOTS.map(kind => {
        const id = c.equipment?.[kind], def = id ? getGearDef(id) : null;
        return <button type="button" key={kind} data-guide-target={showGuide && guide?.step === 'equip' && kind === 'weapon'} className={`ink-person-gear-slot ink-person-gear-slot--${kind}${def ? '' : ' is-empty'}`} aria-label={`更換${EQUIPMENT_LABEL[kind]}`} aria-describedby={`person-gear-${kind}`} onClick={() => setSlot(kind)}>
          <InkBadge src={equipmentArtUrl(def, kind)} size={66} tone="brown" /><strong>{EQUIPMENT_LABEL[kind]}</strong><small id={`person-gear-${kind}`} title={def ? displayGearName(def) : '空置'}>{def ? displayGearName(def) : '空置'}</small>
        </button>;
      })}
      {notice && <p className="ink-person-status" role="status">{notice}</p>}
    </div>
    <div className="ink-person-vitals">{[{label:'氣血',now:c.health,max:c.maxHealth,icon:'blood' as const,tone:'cinnabar' as const},{label:'內力',now:c.qi??0,max:c.maxQi??0,icon:'qi' as const,tone:'blue' as const}].map(v => <div key={v.label}><span><InkIcon name={v.icon} size={20}/>{v.label}</span><b>{Math.round(v.now).toLocaleString('zh-Hant')}／{v.max.toLocaleString('zh-Hant')}</b><InkBrushBar pct={clampPct(v.now,v.max)} tone={v.tone}/></div>)}</div>
    <div className="ink-person-attributes" aria-label="五維與心性"><dl>{wuxiaAttributeKeys.map(key => <div key={key}><dt>{wuxiaAttributeLabels[key]}</dt><dd>{c.attributes[key].toLocaleString('zh-Hant')}</dd></div>)}</dl><p><strong>心性</strong>{natureKeys.map(key => <span key={key}>{natureLabels[key]} <b>{nature[key]}</b></span>)}</p></div>
    <div className="ink-person-actions"><button type="button" onClick={() => onView('skills')}><InkIcon name="scroll" size={32}/>武學</button><button type="button" disabled={busy} onClick={()=>setAppearanceOpen(true)}><AppearanceBadge character={c} size={32}/>造型</button><button type="button" onClick={() => setMore(true)}><InkIcon name="pouch" size={32}/>更多</button></div>
    {appearanceOpen&&<InkAppearancePicker appearance={appearanceOf(c)} busy={busy} onConfirm={setAppearance} onClose={()=>setAppearanceOpen(false)}/>}
    {slot && <InkEquipmentPicker key={`${preset}:${slot}`} state={state} slot={slot} preset={preset} busy={busy} onEquip={id => { const ok=onEquip(id); if(ok)setNotice(`${preset==='normal'?'普通':'對戰'}配搭已更新。`); return ok; }} onClose={() => setSlot(null)}/>}
    {more && <InkPersonSheet title="人物詳情" onClose={() => setMore(false)}><nav className="ink-person-more" aria-label="人物更多功能">{entries.map(entry => <button type="button" key={entry.view} onClick={() => {setMore(false);onView(entry.view);}}>{entry.label}</button>)}<button type="button" onClick={() => {setMore(false);onStats();}}>人物誌</button><button type="button" disabled={busy} onClick={() => {onBest();setMore(false);}}>整裝披掛</button></nav></InkPersonSheet>}
  </section>;
}
