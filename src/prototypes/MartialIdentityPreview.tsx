/** 只限開發版；沿用產品 InkAutoBattle／SparStage，唔讀寫玩家進度或派獎。 */
import { useEffect, useMemo, useState } from 'react';
import { createRng, withRng } from '@core/random';
import { createNewLife } from '@core/life/gameState';
import { startCombat } from '@core/life/combat';
import { runAutoCombat } from '@core/life/autoCombat';
import { SparDuel, sparHeroStats, sparRand } from '@core/life/sparDuel';
import { getSkillDef } from '@data/skills/catalog';
import type { CombatReplay } from '@interfaces/lifeEngine';
import { InkAutoBattle } from '../components/ink/InkAutoBattle';
import { MARTIAL_POSES, martialPoseFor } from '../fx/art/martialPoses';
import { WEAPON_SPRITES } from '../spar/rig';
import { loadSparImage, type SparStage } from '../spar/engine';

/** 真核心 seed42 戰報；角色只存在函數內，驗收參數唔係平衡定案。 */
export function makeMartialReplay(ids: string[], source: 'event' | 'spar' | 'weak' = 'event', sparStage = 12): CombatReplay {
  return withRng(createRng(42), () => {
    const state = createNewLife({ seed: 42, name: '黃問天', skipCoach: true });
    const c = state.character;
    c.skills = ids; c.skillRanks = Object.fromEntries(ids.map(id => [id, 2]));
    c.equippedArts = ids.filter(id => getSkillDef(id)?.kind === 'external').slice(0, 5);
    c.mainArts = { external: c.equippedArts[0] ?? undefined };
    c.volumes = Object.fromEntries(c.equippedArts.map(id => [id, [1, 2, 3, 4, 5, 6, 7]]));
    c.maxHealth = 1800; c.health = 1800; c.maxQi = 4000; c.qi = 4000;
    if (source === 'spar') {
      const duel = new SparDuel(sparHeroStats(state), sparStage, sparRand(42, sparStage));
      while (duel.foe && !duel.foe.boss) { duel.foeHp = 0; duel.ensureLiveFoe(); }
      const foe = duel.foe!;
      const replay: CombatReplay = { title: '演武核心 · 動作驗收', playerName:c.name, foeName:foe.name,
        playerMaxHp:duel.hero.maxHp,startPlayerHp:duel.heroHp,foeMaxHp:foe.maxHp,startFoeHp:duel.foeHp,
        foeBoss:true,foeTier:foe.tier,foeTrait:foe.trait,artId:ids[0],vols:[1],arts:ids.map(id=>({id,vols:[1]})),rounds:[],outcome:'ended' };
      for(let round=1;round<=100;round++) {
        const r=duel.heroStrike();
        const hits:CombatReplay['rounds'][number]['hits']=[{side:'player',skillId:ids[(round-1)%ids.length],vol:1,moveName:getSkillDef(ids[(round-1)%ids.length]!)?.name??'出招',
          crit:r.crit,damage:r.dmg,playerHp:duel.heroHp,foeHp:duel.foeHp,traitFx:r.fx}];
        replay.rounds.push({round,hits});
        if(r.killed){replay.outcome='won';break;}
        const f=duel.foeStrike();hits.push({side:'foe',moveName:'還擊',damage:f.dmg,playerHp:duel.heroHp,foeHp:duel.foeHp,traitFx:f.fx});
        if(f.heroDown){replay.outcome='lost';break;}
      }
      return replay;
    }
    startCombat(state, { source: 'event', title: '武學動畫驗收 · 動畫驗收', foeName: '黑衣刀客', foePower: source === 'weak' ? 'weak' : 'strong', lifeOrDeath: false });
    const replay = runAutoCombat(state);
    if (!replay) throw new Error('未有真實戰報');
    return replay;
  });
}

export default function MartialIdentityPreview() {
  const q = new URLSearchParams(location.search);
  const [id, setId] = useState(q.get('art') ?? 'art_river_fist');
  const [attempt, setAttempt] = useState(0);
  const [speed, setSpeed] = useState(Number(q.get('speed') ?? 1));
  const [effectsOff, setEffectsOff] = useState(q.get('effects') === 'off');
  const [mono, setMono] = useState(q.get('mono') === '1');
  const [inspection, setInspection] = useState(q.get('pose') === '1' || getSkillDef(id)?.kind !== 'external');
  const [time, setTime] = useState(0);
  const [finished, setFinished] = useState(false);
  const legacy = q.get('legacy') === '1';
  const reduced = q.get('reduced') === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const support = getSkillDef(id)?.kind !== 'external';
  const rotation = q.get('rotation') === '1' ? ['art_rain_sword', 'art_river_fist', 'art_stone_palm', 'art_wind_chase', 'art_rain_sword'] : null;
  const replay = useMemo(() => makeMartialReplay(rotation ?? (support ? ['art_river_fist', id] : [id]), q.get('source') === 'spar' ? 'spar' : q.get('source') === 'weak' ? 'weak' : 'event', Math.max(1, Math.min(12, Number(q.get('stage') ?? 12)))), [id, attempt]);
  useEffect(() => {
    if (!inspection) return;
    let raf = 0, prev = 0, total = 0;
    const tick = (now: number) => {
      if (prev) total += Math.min(.05, (now - prev) / 1000) * speed;
      prev = now; setTime(total % (support ? 1.1 : 1.6)); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [inspection, speed, support]);
  const ready = async (stage: SparStage) => {
    // 正式裝備仍係產品自己讀；呢度只喺獨立動畫驗收掛劍驗證空手招式唔帶劍。
    const def = WEAPON_SPRITES.sword;
    if (def) stage.setWeapon(def, await loadSparImage(def.src));
    (window as unknown as { __martialQa?: unknown }).__martialQa = { stage, replay, id, seed: 42 };
  };
  const clean = q.get('clean') === '1';
  return <>
    <InkAutoBattle key={`${id}-${attempt}`} replay={replay} unified season="autumn" reduceMotion={reduced}
      battleBackdropSrc={`${import.meta.env.BASE_URL || '/'}ink/art/battle-preview/autumn.webp`}
      review={{ speed, effectsOff, monochrome: mono, legacy, supports: support ? [id] : [], onStage: ready,
        inspect: inspection ? { id, t: time } : undefined }} onDone={() => { if (!clean) setFinished(true); }}
      notice={finished ? <><h2>演出結束</h2><button onClick={() => { setAttempt(n => n + 1); setFinished(false); }}>重新播放</button></> : undefined} />
    {!clean && <aside style={{ position: 'fixed', zIndex: 99999, bottom: 0, left: 0, right: 0, padding: '8px 12px', background: '#faf5e8', borderTop: '1px solid #9c7154', fontSize: 13 }}>
      <label>武學動畫 <select value={id} onChange={e => { setId(e.target.value); setInspection(getSkillDef(e.target.value)?.kind !== 'external'); setFinished(false); }}>
        {MARTIAL_POSES.map(d => <option key={d.id} value={d.id}>{getSkillDef(d.id)?.name} · {d.premium ? '珍本' : '一般'}</option>)}
      </select></label>{' '}
      <label>速度 <select value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={1}>正常</option><option value={.25}>四分一慢速</option></select></label>
      <div><label><input type="checkbox" checked={effectsOff} onChange={e => setEffectsOff(e.target.checked)} />關閉附加特效</label>{' '}
        <label><input type="checkbox" checked={mono} onChange={e => setMono(e.target.checked)} />統一墨色</label>{' '}
        <label><input type="checkbox" checked={inspection} onChange={e => setInspection(e.target.checked)} />只看肢體</label></div>
      <small>{support || inspection ? '姿勢時間線檢視，沒有結算攻擊。' : '真實核心戰報，沿用產品同一呈現器。'} {martialPoseFor(id)?.premium ? '珍本變體仍待完整重製及驗收。' : ''} seed42 · 不寫存檔</small>
    </aside>}
  </>;
}
