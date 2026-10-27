import { useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { getSkillDef, skillLabel } from '@data/skills/catalog';
import { getGearDef } from '@data/equipment/catalog';
import { describeSchoolBonus, schoolTally } from '@core/life/schools';
import { martialSlots, supportMartialSlots, INTERNAL_ART_SLOT, QINGGONG_ART_SLOT } from '@core/life/martialLoadout';
import { ownedVolumes } from '@core/life/volumes';
import { internalQiRegen } from '@core/life/martialTurn';
import { NATURAL_QI_REGEN_RATIO } from '@data/redesign/martialEconomyParams';
import { codexCoverUrl } from '../../fx/highlight/codexAppearance';
import { InkPersonSheet } from './InkPersonSheet';
import { InkIcon } from './InkIcon';
import { rankName } from '@core/life/martialRanks';
import './martial-screen.css';

type Props = { state: LifeGameState; selected: string | null; busy: boolean; onCancel: () => void; onChoose: (slot: number) => void };

/** 配搭固定一屏；點欄位先比較確認，長說明與加成放於冊頁。 */
export function InkMainArts({ state, selected, busy, onCancel, onChoose }: Props) {
  const c=state.character, slots=martialSlots(c), support=supportMartialSlots(c), regen=internalQiRegen(c);
  const [sheet,setSheet]=useState<'recovery'|'synergy'|null>(null);
  const active=schoolTally(c).filter(t=>t.level!=='none');
  const chosen=selected?getSkillDef(selected):null;
  const amount=(v:number)=>Number(v.toFixed(2)).toLocaleString('zh-Hant');
  const slotCard=(id:string|null,index:number,label:string,kind:'external'|'internal'|'qinggong')=>{
    const def=id?getSkillDef(id):null, count=id?ownedVolumes(c,id).length:0;
    const compatible=!chosen||chosen.kind===kind;
    return <li key={index} className={`ink-martial-slot${id?'':' is-empty'}`} data-martial-slot={index} data-kind={kind} data-premium={def?.premium?'1':'0'}>
      <button type="button" disabled={busy||!compatible} aria-label={`${id?'更換':'選擇'}${kind==='external'?`外功欄位${index+1}`:`${label}欄位`}`} onClick={()=>onChoose(index)}>
        <span className="ink-martial-slot-label">{kind==='external'?`外功${label}`:label}</span>
        {def?<img src={codexCoverUrl(def.premium===true)} alt="" width="48" height="72"/>:<InkIcon name="scroll" size={48}/>}
        <strong>{id?skillLabel(id):`選擇${kind==='external'?'外功':label}`}</strong>
        <small>{def?(kind==='external'?`${count}/7卷 · ${def.move?.qiCost??0}內`:rankName(c.skillRanks[id!]??0)):'點選裝入'}</small>
        {chosen&&compatible&&<span className="ink-martial-target">選此欄位</span>}
      </button>
    </li>;
  };
  return <section className="ink-martial-loadout ink-loadout" aria-label="武學裝備">
    {chosen?<div className="ink-martial-selection" role="status"><span>為「{chosen.name}」選擇欄位</span><button type="button" onClick={onCancel}>取消</button></div>:
      <div className="ink-martial-intro"><strong>五門外功</strong><span>{slots.filter(Boolean).length}／5 已配搭 · 每門扣內一次</span></div>}
    <ol className="ink-martial-external" aria-label="五門外功">{slots.map((id,index)=>slotCard(id,index,['一','二','三','四','五'][index]!,'external'))}</ol>
    <ul className="ink-martial-support" aria-label="內功與身法獨立欄位">
      {slotCard(support.internal,INTERNAL_ART_SLOT,'內功','internal')}{slotCard(support.qinggong,QINGGONG_ART_SLOT,'身法','qinggong')}
    </ul>
    <div className="ink-martial-footer">
      <button type="button" onClick={()=>setSheet('recovery')} aria-label="查看耗內與回內"><span>每回合回內</span><strong>自然 {amount(NATURAL_QI_REGEN_RATIO*100)}%{regen.flat>0?` ＋ ${amount(regen.flat)}點`:regen.percent>0?` ＋ ${amount(regen.percent*100)}%`:''}</strong><small>耗內與回內 ›</small></button>
      <button type="button" onClick={()=>setSheet('synergy')}><span>配搭加成</span><strong>{active.length}項生效</strong><small>查看加成 ›</small></button>
    </div>
    {sheet&&<InkPersonSheet title={sheet==='recovery'?'耗內與回內':'配搭加成'} onClose={()=>setSheet(null)} className="ink-martial-info-sheet">
      <div className="ink-martial-info-body">{sheet==='recovery'?<>
        <h3>整門連招</h3><p>每回合輪替一門外功，只扣該門一次起手內力，已學卷次依序連出。收齊七卷亦不加耗內；演武台不耗內。</p>
        <h3>每回合回內</h3><p>自然回內 {amount(NATURAL_QI_REGEN_RATIO*100)}%，按本場內力上限計算。</p><p>已配內功另回：{regen.flat>0?`${amount(regen.flat)}點`:regen.percent>0?`${amount(regen.percent*100)}%`:'尚無加成'}。固定回內與百分比回內均按現行內功、熟練及藏本升階計算。</p>
        <p>所有外功均無法使出時，調息回復30%內力。開戰後更改配搭，於下一場生效。</p>
      </>:<><p>同派兩門小成、三門大成；同派裝備可計一門。所有流派均可混合配搭。</p>{active.length?<ul>{active.map(t=><li key={t.school.id}><h3>{t.school.name} · {t.level==='major'?'大成':'小成'}</h3><p>{describeSchoolBonus(t.level==='major'?t.school.major:t.school.minor)}{t.gear?`（含裝備「${getGearDef(t.gear)?.name??''}」）`:''}</p></li>)}</ul>:<p>目前尚無同派加成。</p>}</>}</div>
    </InkPersonSheet>}
  </section>;
}
