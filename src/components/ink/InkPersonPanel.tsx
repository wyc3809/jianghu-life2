import { InkPersonOverview } from './InkPersonOverview';
import { InkPersonNativeContext } from './InkPersonSheet';
import { InkTapCard } from './InkTapCard';
import { characterForPreset, type PresetKind } from '@core/life/loadoutPresets';
import { combatRating, combatRatingTier } from '@core/life/combatRating';
import { jianghuRank, JIANGHU_RANK_START } from '@core/life/jianghuRank';
import { jianghuPrestige } from '@core/life/jianghuPrestige';
import { InkMainArts } from './InkMainArts';
import { InkMartialPicker } from './InkMartialPicker';
import { VOLUME_COUNT, VOLUME_NUMERALS, artVolumeMoves, hasVolumes } from '@data/skills/volumes';
import { ownedVolumes, collectionVolumes } from '@core/life/volumes';
import { equippedMartialArts, INTERNAL_ART_SLOT, QINGGONG_ART_SLOT } from '@core/life/martialLoadout';
import { useAncestryStore } from '../../store/ancestryStore';
import { SCHOOLS, schoolOfGear, primarySchoolOfSkill, type SchoolId } from '@data/redesign/schools';
import { InkSkillSchools } from './InkSchoolTabs';
import { InkPersonSchoolTabs as InkSchoolTabs } from './InkPersonSchoolTabs';
import { useEffect, useRef, useState } from 'react';
import { useLifeStore } from '../../store/lifeStore';
import { canRetire } from '@core/life/retire';
import { inkCountTo, inkPopIn } from '../../ui/inkMotion';
import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  natureKeys,
  natureLabels,
  wuxiaAttributeKeys,
  wuxiaAttributeLabels,
} from '@interfaces/lifeEngine';
import { getGearDef, WEAPON_KIND_LABEL } from '@data/equipment/catalog';
import {
  RARITY_SHORT,
  SLOT_LABEL,
  displayGearName,
  formatAffixDisplay,
  gearTitleBits,
  listGearAffixes,
  summarizeAffixTotals,
} from '@data/equipment/affixes';
import { gearTotals, sumGearCombatBonuses, previewEquipDelta, combatPowerScore } from '@core/life/equipment';
import { MOVE_STANCE_LABEL, resolveMoveStance } from '@core/life/moveStance';
import { skillDisplay } from '@core/life/flavor';
import { rankName, skillAdvanceHint, skillAdvancePercent } from '@core/life/martialRanks';
import { formatSkillEffects, getSkillDef, skillKindLabel } from '@data/skills/catalog';
import { ensureNature, dominantNature, natureSummary } from '@core/life/nature';
import { playerEvasionPercent } from '@core/life/jianghuHints';
import { listWeaponMasteries } from '@core/life/weaponMastery';
import { careerLabel, getCareer } from '@core/life/careers';
import { formatFragmentProgress } from '@core/life/manualFragments';
import { getMasterName } from '@core/life/bonds';
import { familyGearCarry, getHeirName, listChildNames, previewInheritanceMoney } from '@core/life/family';
import { buildGenealogy } from '@core/life/genealogy';
import { achievementProgress, listAchievementStatus } from '@core/life/achievements';
import { allTitles } from '@core/life/titles';
import { calculateProgress } from '@core/life/progression';
import { MANUAL_MAX_STARS, MANUAL_STAR_BONUS, TEST_BREAKTHROUGH_FAIL_XP_LOSS, RETIRE_MIN_TIER } from '@data/redesign/testParams';
import { SPAR_TIER_SCALE, sparHeroBreakdown, sparSavedStage } from '@core/life/sparDuel';
import { InkStatsPanel } from './InkStatsPanel';
import { InkInjuryCard } from './InkInjuryCard';
import {
  calculateCultivationRate,
  effectiveCultivationRate,
  MAX_TIER_FILL_SECONDS,
  canAttemptBreakthrough,
  cultivationProgressPercent,
  currentCultivationTier,
  CULTIVATION_TIERS,
  isCultivationCapped,
  cultivationReserve,
  cultivationReserveCap,
  breakthroughChance,
} from '@core/life/cultivation';

export type PersonView =
  | 'main'
  | 'overview'
  | 'attrs'
  | 'skills'
  | 'gear'
  | 'genealogy'
  | 'people'
  | 'roots'
  | 'achievements'
  | 'cultivation'
  | 'combat';

type Props = {
  state: LifeGameState;
  view: PersonView;
  onView: (v: PersonView) => void;
  busy: boolean;
  onEquip: (id: string, preset?: PresetKind) => void;
  onBack: () => void;
  onEquipBest: (preset: PresetKind) => void;
  onBreakthrough: () => void;
  initialPreset?: PresetKind;
  requestedArt?: string | null;
  onRequestHandled?: () => void;
  onSetMartialSlot: (slot: number, id: string | null, preset?: PresetKind) => boolean;
};

const pctText = (v: number) => `${(v * 100).toFixed(1).replace(/\.0$/, '')}%`;
const numText = (v: number) => Math.round(v).toLocaleString('en-US');

/** 歸隱傳位（審計 C2）：要撳兩下確認，避免誤觸結束今世 */
function InkRetireBox({ state, busy }: { state: LifeGameState; busy: boolean }) {
  const retire = useLifeStore((s) => s.retire);
  const [confirming, setConfirming] = useState(false);
  const check = canRetire(state);
  return (
    <div className="ink-retire">
      <h3 className="ink-subhead">歸隱傳位</h3>
      <p className="ink-note">
        {check.ok
          ? '金盆洗手，結束此生。傳承與身故相同：傳承點、家傳武學、銀庫及裝備庫照常留給後人。'
          : `${check.reason ?? ''}（第 ${RETIRE_MIN_TIER} 境起可自願歸隱，傳承與身故相同）`}
      </p>
      {check.ok && (
        <button
          type="button"
          className={`ink-btn ${confirming ? 'ink-btn--primary' : 'ink-btn--quiet'}`}
          disabled={busy}
          onClick={() => (confirming ? retire() : setConfirming(true))}
          onBlur={() => setConfirming(false)}
        >
          {confirming ? '確定歸隱？請再按一次' : '歸隱傳位'}
        </button>
      )}
    </div>
  );
}

export function InkPersonPanel({
  state,
  view,
  onView,
  busy,
  onEquip,
  onBack,
  onEquipBest,
  onBreakthrough,
  requestedArt,
  initialPreset,
  onRequestHandled,
  onSetMartialSlot,
}: Props) {
  const [martialView, setMartialView] = useState<'loadout' | 'library' | 'rules'>('loadout');
  const [preset, setPreset] = useState<PresetKind>(initialPreset ?? 'normal');
  const displayState = preset === 'duel' && (view === 'main' || view === 'skills' || view === 'gear') ? { ...state, character: characterForPreset(state.character, 'duel') } : state;
  const [previewGearId, setPreviewGearId] = useState<string | null>(null);
  const [showStatsScroll, setShowStatsScroll] = useState(false);
  const [skillSchool, setSkillSchool] = useState<SchoolId | 'all'>('all');
  const [selectedArt, setSelectedArt] = useState<string | null>(requestedArt ?? null);
  const [equipNotice, setEquipNotice] = useState('');
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const collection = useAncestryStore(s => s.meta);
  const manuals = collection.manuals;
  useEffect(() => {
    if (!requestedArt) return;
    setPreset('normal'); setMartialView('loadout'); setSelectedArt(requestedArt); setSkillSchool('all'); setEquipNotice('');
    const body = paneRef.current?.closest<HTMLElement>('.ink-play-body');
    const loadout = paneRef.current?.querySelector('.ink-loadout');
    if (body && loadout) body.scrollTop += loadout.getBoundingClientRect().top - body.getBoundingClientRect().top;
    onRequestHandled?.();
  }, [requestedArt, onRequestHandled]);
  const selectArt = (id: string) => {
    setSelectedArt(id); setMartialView('loadout'); setEquipNotice('');
  };
  const equipArt = (slot: number, id: string | null) => {
    if (onSetMartialSlot(slot, id, preset)) {
      const label = slot === INTERNAL_ART_SLOT ? '內功欄位' : slot === QINGGONG_ART_SLOT ? '身法欄位' : `外功欄位${slot + 1}`;
      setEquipNotice(id ? `已裝備「${getSkillDef(id)?.name ?? id}」至${label}。` : `已卸下${label}的武學。`);
      setSelectedArt(null);
      setPickerSlot(null);
      return true;
    }
    setEquipNotice('未能調整裝備，請在戰鬥結束後重試。');
    return false;
  };
  // anime.js：入頁時列表／格仔錯開落筆出場；戰力數字由 0 滾到現值
  const paneRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    pane.closest<HTMLElement>('.ink-play-body')?.scrollTo({top:0});
    inkPopIn(
      pane.querySelectorAll('.ink-bitlife-row, .ink-combat-grid > div, .ink-delta-row, .ink-ach-list > li'),
      { step: 32, y: 10 },
    );
    pane.querySelectorAll<HTMLElement>('[data-count]').forEach((el, i) => {
      const to = Number(el.dataset.count);
      const kind = el.dataset.fmt;
      const fmt = (n: number) =>
        kind === 'pct' ? `${(n * 100).toFixed(1).replace(/\.0$/, '')}%` : Math.round(n).toLocaleString('en-US');
      setTimeout(() => inkCountTo(el, 0, to, fmt, 820), 60 + i * 50);
    });
  }, [view]);
  const c = displayState.character;
  const mainArtIds = equippedMartialArts(c);
  const availableArts = [...new Set([...c.skills, ...Object.keys(manuals ?? {})])].filter(id => getSkillDef(id));
  const nature = ensureNature(c);
  const dominant = dominantNature(c);
  const lover = c.loverId ? state.npcs[c.loverId] : null;
  const sect = c.sectId ? state.sects[c.sectId] : null;
  const gearIds = c.gear ?? [];
  const equipment = c.equipment ?? { weapon: null, armor: null, accessory: null };
  const gearStatTotals = gearTotals(c);
  const gearFxTotals = sumGearCombatBonuses(c);
  const genealogy = buildGenealogy(state);
  const achProgress = achievementProgress(state);
  const nicknames = allTitles(state).map((t) => t.label);
  const progress = calculateProgress(state);
  const spar = sparHeroBreakdown(state);

  const overviewContent = <>
        <div className="ink-vitals-meters ink-progress-overview">
          {progress.bars.map((bar) => (
            <div className="ink-meter" key={bar.key}>
              <div className="ink-vitals-label">
                <span>{bar.label}</span>
                <span>{bar.raw}</span>
              </div>
              <div
                className="ink-bar"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={bar.percent}
                aria-label={bar.label}
              >
                <div className="ink-bar-fill ink-bar-fill--enter" style={{ width: `${bar.percent}%` }} />
              </div>
            </div>
          ))}
          {progress.sect && (
            <div className="ink-meter">
              <div className="ink-vitals-label">
                <span>門派地位</span>
                <span>
                  {progress.sect.label}
                  {progress.sect.nextLabel ? ` → ${progress.sect.nextLabel}` : ''}
                </span>
              </div>
              <div
                className="ink-bar"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress.sect.percent}
                aria-label="門派地位"
              >
                <div
                  className="ink-bar-fill ink-bar-fill--enter"
                  style={{ width: `${progress.sect.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <InkInjuryCard character={c} />
  </>;
  if (view === 'main') {
    return <InkPersonNativeContext.Provider value={true}>
      <InkPersonOverview state={displayState} preset={preset} busy={busy} onPreset={setPreset}
        onEquip={id => {onEquip(id,preset);const next=useLifeStore.getState().state;const def=getGearDef(id);return Boolean(next && def && characterForPreset(next.character,preset).equipment[def.slot]===id);}} onView={onView} onBack={onBack}
        onStats={() => setShowStatsScroll(true)} onBest={() => onEquipBest(preset)} />
      {showStatsScroll && <InkStatsPanel state={displayState} onClose={() => setShowStatsScroll(false)} />}
    </InkPersonNativeContext.Provider>;
  }

  return (
    <InkPersonNativeContext.Provider value={true}>
    <section className="ink-panel ink-attrs ink-tab-pane ink-tap-screen" aria-label="人物詳情" ref={paneRef}>
      <button
        type="button"
        className="ink-btn ink-btn--quiet ink-person-back"
        onClick={() => {
          setPreviewGearId(null);
          onView('main');
        }}
      >
        ← 返回人物
      </button>

      {(view === 'skills' || view === 'gear') && <div className="ink-preset-select">
        <div className="ink-preset-tabs" role="tablist" aria-label="配搭方案">{(['normal','duel'] as const).map(kind =>
          <button type="button" key={kind} role="tab" aria-selected={preset === kind} className="ink-btn ink-btn--quiet" onClick={() => { setPreset(kind); setSelectedArt(null); setPickerSlot(null); setPreviewGearId(null); setEquipNotice(''); }}>{kind === 'normal' ? '普通配搭' : '對戰配搭'}</button>)}</div>
        <p className="ink-note">{preset === 'normal' ? '演武台、江湖交手使用。' : '華山、多人挑戰及離線防守使用。'}配搭獨立保存，收藏與養成共用。</p>
      </div>}

      {view === 'skills' && <div className="ink-tap-segments" role="tablist" aria-label="武學內容">
        {([['loadout','配搭'],['library','收藏'],['rules','規則']] as const).map(([id,label])=><button key={id} type="button" role="tab" aria-selected={martialView===id} className="ink-btn ink-btn--quiet" onClick={()=>{setMartialView(id);setSelectedArt(null);}}>{label}</button>)}
      </div>}
      <div className="ink-person-detail-body" key={`${view}:${preset}:${martialView}:${skillSchool}`}>
      {view === 'overview' && overviewContent}
      {view === 'cultivation' &&
        (() => {
          const tier = currentCultivationTier(state);
          const rate = calculateCultivationRate(state);
          const effective = effectiveCultivationRate(state);
          const pct = cultivationProgressPercent(state);
          const capped = isCultivationCapped(state);
          const canBreak = canAttemptBreakthrough(state);
          const nextTier = CULTIVATION_TIERS[tier.level + 1];
          return (
            <>
              <h3>修為</h3>
              <p className="ink-note">
                現時境界：{tier.name}
                {nextTier ? ` · 下一境：${nextTier.name}` : ' · 已至巔峰'}
              </p>
              <div className="ink-meter">
                <div className="ink-vitals-label">
                  <span>修為</span>
                  <span>
                    {Math.floor(c.cultivation.xp).toLocaleString('zh-Hant')}
                    {Number.isFinite(tier.cap) ? ` / ${tier.cap.toLocaleString('zh-Hant')}` : ''}
                  </span>
                </div>
                <div
                  className={`ink-bar${capped ? ' ink-bar--capped' : ''}`}
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  aria-label="修為進度"
                >
                  <div className="ink-bar-fill ink-bar-fill--enter" style={{ width: `${pct}%` }} />
                </div>
                {Number.isFinite(tier.cap) && (
                  <div className="ink-vitals-label ink-reserve-label">
                    <span>儲備</span>
                    <span>
                      {Math.floor(cultivationReserve(state)).toLocaleString('zh-Hant')} /{' '}
                      {cultivationReserveCap(state).toLocaleString('zh-Hant')}
                    </span>
                  </div>
                )}
              </div>

              <h3 className="ink-subhead">速率拆解（修為/秒）</h3>
              <ul className="ink-delta-board" aria-label="修為速率拆解">
                <li className="ink-delta-row ink-delta-row--flat">
                  <span className="ink-delta-row-text">基礎吐納 ＋{rate.base.toFixed(2)}</span>
                </li>
                <li className="ink-delta-row ink-delta-row--flat">
                  <span className="ink-delta-row-text">武學根基 ＋{rate.fromMartial.toFixed(2)}</span>
                </li>
                <li className="ink-delta-row ink-delta-row--flat">
                  <span className="ink-delta-row-text">已學功法 ＋{rate.fromSkills.toFixed(2)}</span>
                </li>
                {rate.fromSect > 0 && (
                  <li className="ink-delta-row ink-delta-row--up">
                    <span className="ink-delta-row-text">門派加成 ＋{rate.fromSect.toFixed(2)}</span>
                  </li>
                )}
                {rate.fromGear > 0 && (
                  <li className="ink-delta-row ink-delta-row--up">
                    <span className="ink-delta-row-text">裝備詞條 ＋{rate.fromGear.toFixed(2)}</span>
                  </li>
                )}
                {effective > rate.total && (
                  <li className="ink-delta-row ink-delta-row--up">
                    <span className="ink-delta-row-text">
                      閉關保底 ＋{(effective - rate.total).toFixed(2)}（{MAX_TIER_FILL_SECONDS / 3600} 小時內必滿）
                    </span>
                  </li>
                )}
                <li className="ink-delta-row ink-delta-row--flat">
                  <strong className="ink-delta-row-text">總計 ＋{effective.toFixed(2)}／秒</strong>
                </li>
              </ul>

              {capped && nextTier && (
                <>
                  <p className="ink-note">
                    修為已滿，需突破方可入「{nextTier.name}」之境。成功率約{' '}
                    <strong>{Math.round(breakthroughChance(state) * 100)}%</strong>
                    （根骨、悟性越高越易）。失敗會扣 {Math.round(TEST_BREAKTHROUGH_FAIL_XP_LOSS * 100)}% 修為及少量氣血、內力，修為儲滿可再試。
                  </p>
                  <button
                    type="button"
                    className="ink-btn ink-btn--primary ink-btn--pulse"
                    disabled={busy || !canBreak}
                    onClick={() => onBreakthrough()}
                  >
                    閉關突破
                  </button>
                </>
              )}
              <InkRetireBox state={state} busy={busy} />
            </>
          );
        })()}

      {view === 'attrs' && (
        <>
          <h3>五維心性</h3>
          <div className="ink-attr-grid">
            {wuxiaAttributeKeys.map((k) => (
              <div key={k} className="ink-attr">
                <span className="ink-attr-label">{wuxiaAttributeLabels[k]}</span>
                <strong>{c.attributes[k]}</strong>
              </div>
            ))}
          </div>
          <h3 className="ink-subhead">心性</h3>
          <div className="ink-attr-grid">
            {natureKeys.map((k) => (
              <div
                key={k}
                className={`ink-attr ink-nature-card ink-nature--${k}${
                  k === dominant ? ' ink-nature--dominant' : ''
                }`}
              >
                <span className="ink-attr-label">
                  {natureLabels[k]}
                  {k === dominant ? ' · 獨顯' : ''}
                </span>
                <strong>{nature[k]}</strong>
              </div>
            ))}
          </div>
          <p className="ink-note">{natureSummary(c)}</p>
          <p className="ink-note">
            閃避約 {playerEvasionPercent(state)}%
          </p>
          <p className="ink-note">
            籍貫 · {c.birthplace || '千燈鎮'} · 所在 {c.location || '千燈鎮'}
          </p>
        </>
      )}

      {view === 'skills' && (
        <>
          <h3>武學</h3>
          {equipNotice && <p className="ink-note ink-loadout-notice" role="status">{equipNotice}</p>}
          {martialView === 'loadout' && <InkMainArts state={displayState} selected={selectedArt} busy={busy} onEquip={equipArt} onCancel={() => setSelectedArt(null)} onChoose={slot => { setSelectedArt(null); setPickerSlot(slot); }} />}
          {pickerSlot !== null && <InkMartialPicker state={displayState} collection={collection} slot={pickerSlot} preset={preset} busy={busy}
            onEquip={id => equipArt(pickerSlot, id)} onClose={() => setPickerSlot(null)} />}
          {martialView === 'rules' && <div className="ink-loadout-rules"><h4>連招、回內與養成規則</h4>
            <p className="ink-note">演武台連招不耗內；其他交手每門外功起手只扣一次內力，已學卷次依序連出。每回合自然回內1%，另計已裝備內功；全部武學均無法使出時調息回復30%。藏本升階跨代保留，熟練由本代實戰及修煉累積。開戰後更改配搭，留待下一場生效。</p>
          </div>}
          {martialView === 'library' && <>
          <InkSchoolTabs value={skillSchool} onChange={setSkillSchool} allowAll label="武學流派分類" />
          {skillSchool !== 'all' && !availableArts.some(id => primarySchoolOfSkill(getSkillDef(id)) === skillSchool) && <p className="ink-note">此流派尚無可用武學。</p>}
          {listWeaponMasteries(state).length > 0 && (
            <p className="ink-note">
              兵刃專精 ·{' '}
              {listWeaponMasteries(state)
                .map((m) => `${m.label}${m.level}境`)
                .join(' · ')}
            </p>
          )}
          {availableArts.length === 0 ? (
            <p className="ink-note">尚未習武。</p>
          ) : (
            <ul className="ink-skill-cards">
              {availableArts.filter(id => skillSchool === 'all' || primarySchoolOfSkill(getSkillDef(id)) === skillSchool).map((id) => {
                const def = getSkillDef(id);
                const kind = def?.kind ?? 'external';
                const stance = def?.move ? resolveMoveStance(def.move) : null;
                const advancePct = skillAdvancePercent(c, id);
                const isMain = mainArtIds.includes(id);
                return (
                  <InkTapCard key={id} title={def?.name ?? id} subtitle={`${skillKindLabel(kind)} · ${isMain ? '已裝備' : c.skills.includes(id) ? '已習得' : '收藏待習得'}`} detailClassName={`ink-skill-card ink-skill-card--${kind}`} closeOnAction>
                    <div className="ink-skill-card-head">
                      <strong>{c.skills.includes(id) ? skillDisplay(c, id) : def?.name ?? id}</strong>
                      <span className="ink-skill-badge">{skillKindLabel(kind)}</span>
                      <span className="ink-skill-badge">{def?.premium ? '珍本' : '江湖'}</span>
                      {isMain ? <span className="ink-main-badge">已裝備</span> : !c.skills.includes(id) ? <span className="ink-main-badge">收藏 · 待習得</span> : null}
                      {stance ? (
                        <span className={`ink-stance-seal ink-stance-seal--${stance}`}>
                          {MOVE_STANCE_LABEL[stance]}
                        </span>
                      ) : null}
                    </div>
                    {def?.move ? (
                      <p className="ink-skill-move">
                        戰招「{def.move.name}」
                        {stance ? ` · ${MOVE_STANCE_LABEL[stance]}` : ''}
                        {def.move.qiCost > 0 ? ` · 整套耗內${def.move.qiCost}` : ' · 無耗'}
                        {def.move.power > 0 ? ` · 威×${def.move.power.toFixed(1)}` : ''}
                      </p>
                    ) : null}
                    {hasVolumes(id) ? (
                      <p className="ink-skill-vols" aria-label="七卷">
                        {artVolumeMoves(id).map((m, i) => {
                          const on = (c.skills.includes(id) ? ownedVolumes(c, id) : collectionVolumes(collection, id)).includes(i + 1);
                          return (
                            <i key={m.id} className={on ? 'is-on' : ''} title={on ? m.name : '未得'}>
                              {VOLUME_NUMERALS[i]}
                            </i>
                          );
                        })}
                        <span>
                          已得 {(c.skills.includes(id) ? ownedVolumes(c, id) : collectionVolumes(collection, id)).length}／{VOLUME_COUNT} 卷 · 裝備後可於自動交手逐卷出招
                        </span>
                      </p>
                    ) : null}
                    <p className="ink-note">藏本升階 {manuals?.[id]?.stars ?? 0}／{MANUAL_MAX_STARS}{(manuals?.[id]?.stars ?? 0) > 0 ? ` · 效果＋${Math.round((manuals?.[id]?.stars ?? 0) * MANUAL_STAR_BONUS * 100)}%` : ''}</p>
                    <p className="ink-skill-fx">原始效果：{formatSkillEffects(id) || '尚無詳載'}</p>
                    <div className="ink-skill-school-row">
                      <span className="ink-main-slot-tags">
                        <InkSkillSchools id={id} related />
                      </span>
                      {!isMain && (
                        <button
                          type="button"
                          className="ink-btn ink-btn--quiet ink-main-set"
                          disabled={busy}
                          aria-label={`選擇裝備：${getSkillDef(id)?.name ?? id}`}
                          onClick={() => selectArt(id)}
                        >
                          選擇裝備
                        </button>
                      )}
                    </div>
                    {!c.skills.includes(id) ? <p className="ink-note ink-skill-progress">尚未習得，選定裝備欄位後開始修煉。</p> : advancePct === null ? (
                      <p className="ink-note ink-skill-progress">{skillAdvanceHint(c, id)}</p>
                    ) : (
                      <div
                        className={`ink-skill-advance-bar${advancePct >= 85 ? ' ink-skill-advance-bar--close' : ''}`}
                      >
                        <div className="ink-skill-advance-track">
                          <div
                            className="ink-skill-advance-fill"
                            style={{ ['--pct' as string]: `${advancePct}%` }}
                          />
                        </div>
                        <span className="ink-skill-advance-label">
                          距「{rankName((c.skillRanks?.[id] ?? 0) + 1)}」 {advancePct}%
                        </span>
                      </div>
                    )}
                  </InkTapCard>
                );
              })}
            </ul>
          )}
          {formatFragmentProgress(state).length > 0 && (
            <>
              <h3 className="ink-subhead">殘譜</h3>
              <ul className="ink-delta-board ink-playability-board">
                {formatFragmentProgress(state).map((line) => (
                  <li key={line} className="ink-delta-row ink-delta-row--flat">
                    <span className="ink-delta-row-text">{line}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          </>}
        </>
      )}

      {view === 'gear' && (
        <>
          <h3>裝備</h3>
          <p className="ink-note ink-gear-totals">
            <span className="ink-gear-power">戰意 {combatPowerScore(c)}</span>
            {(() => {
              const bits = summarizeAffixTotals({ ...gearStatTotals, ...gearFxTotals });
              return bits.length ? ` · ${bits.join(' · ')}` : '';
            })()}
          </p>
          <div className="ink-gear-slots" aria-label="已披掛">
            {(['weapon', 'armor', 'accessory'] as const).map((slot) => {
              const id = equipment[slot];
              const def = id ? getGearDef(id) : null;
              const affixes = def ? listGearAffixes(def) : [];
              return (
                <div
                  key={slot}
                  className={`ink-gear-slot${def ? ` ink-gear-slot--${def.rarity}` : ' ink-gear-slot--empty'}`}
                >
                  <span className="ink-gear-slot-label">{SLOT_LABEL[slot]}</span>
                  {def ? (
                    <>
                      <strong className={`ink-gear-name ink-rarity-${def.rarity}`}>
                        {displayGearName(def)}
                      </strong>
                      <span className="ink-gear-meta">
                        {RARITY_SHORT[def.rarity]}
                        {def.weaponKind ? ` · ${WEAPON_KIND_LABEL[def.weaponKind]}` : ''}
                      </span>
                      <ul className="ink-affix-list ink-affix-list--compact">
                        {affixes.slice(0, 3).map((line) => (
                          <li key={`${line.tier}-${line.text}`} className={`ink-affix ink-affix--${line.tier}`}>
                            {formatAffixDisplay(line)}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <span className="ink-gear-empty">空</span>
                  )}
                </div>
              );
            })}
          </div>
          {gearIds.length === 0 ? (
            <p className="ink-note">行囊尚空。</p>
          ) : (
            <ul className="ink-gear-cards">
              {gearIds.map((id) => {
                const def = getGearDef(id);
                if (!def) return null;
                const equipped = equipment[def.slot] === id;
                const preview = previewGearId === id ? previewEquipDelta(c, id) : null;
                const affixes = listGearAffixes(def);
                return (
                  <InkTapCard key={id} title={displayGearName(def)} subtitle={`${SLOT_LABEL[def.slot]} · ${RARITY_SHORT[def.rarity]}${equipped?' · 已裝備':''}`} detailClassName={`ink-gear-card ink-gear-card--${def.rarity}`}>
                    <div className="ink-gear-card-head">
                      <strong className={`ink-gear-name ink-rarity-${def.rarity}`}>
                        {displayGearName(def)}
                      </strong>
                      <span className={`ink-rarity-tag ink-rarity-${def.rarity}`}>
                        {RARITY_SHORT[def.rarity]}
                      </span>
                      {equipped ? <span className="ink-gear-on-tag">披中</span> : null}
                      {(() => {
                        const sid = schoolOfGear(def);
                        return sid ? (
                          <i className={`ink-school-tag ink-school-tag--${sid}`}>
                            {SCHOOLS.find((x) => x.id === sid)?.name}
                          </i>
                        ) : null;
                      })()}
                    </div>
                    <p className="ink-gear-meta">
                      {gearTitleBits(def)} · {SLOT_LABEL[def.slot]}
                    </p>
                    <ul className="ink-affix-list">
                      {affixes.map((line) => (
                        <li
                          key={`${line.tier}-${line.name ?? ''}-${line.text}`}
                          className={`ink-affix ink-affix--${line.tier}`}
                        >
                          {formatAffixDisplay(line)}
                        </li>
                      ))}
                    </ul>
                    <p className="ink-gear-desc">{def.description}</p>
                    <div className="ink-gear-actions">
                      {!equipped && (
                        <button
                          type="button"
                          className="ink-btn ink-btn--quiet"
                          disabled={busy}
                          onClick={() => {
                            setPreviewGearId(previewGearId === id ? null : id);
                          }}
                        >
                          {previewGearId === id ? '收起' : '對比'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="ink-btn ink-btn--quiet"
                        disabled={busy || equipped}
                        onClick={() => {
                          setPreviewGearId(null);
                          onEquip(id, preset);
                        }}
                      >
                        {equipped ? '披中' : '披上'}
                      </button>
                    </div>
                    {preview && !preview.alreadyEquipped && (
                      <p
                        className={`ink-gear-preview${
                          preview.powerDelta >= 0 ? ' ink-gear-preview--up' : ' ink-gear-preview--down'
                        }`}
                      >
                        若披上：{preview.summary}
                      </p>
                    )}
                  </InkTapCard>
                );
              })}
            </ul>
          )}
          <button type="button" className="ink-btn ink-btn--quiet" disabled={busy} onClick={() => onEquipBest(preset)}>
            整裝披掛
          </button>
        </>
      )}

      {view === 'genealogy' && (
        <>
          <h3>族譜</h3>
          <div className="ink-genealogy" aria-label={`族譜·${genealogy.clanLabel}`}>
            <p className="ink-genealogy-head">
              {genealogy.clanLabel} · 第{genealogy.generationIndex}世
            </p>
            <ul className="ink-genealogy-list">
              {genealogy.entries.map((e, i) => {
                const prev = genealogy.entries[i - 1];
                const showGen = !prev || prev.generation !== e.generation;
                return (
                  <li
                    key={`${e.generation}-${e.title}-${e.name}-${i}`}
                    className={`ink-genealogy-row${e.self ? ' ink-genealogy-row--self' : ''}${
                      e.heir ? ' ink-genealogy-row--heir' : ''
                    }`}
                  >
                    {showGen ? (
                      <span className="ink-genealogy-gen">{e.generation}</span>
                    ) : (
                      <span className="ink-genealogy-gen ink-genealogy-gen--gap" aria-hidden />
                    )}
                    <span className="ink-genealogy-title">{e.title}</span>
                    <strong className="ink-genealogy-name">{e.name}</strong>
                    {e.note ? <span className="ink-genealogy-note">{e.note}</span> : null}
                  </li>
                );
              })}
            </ul>
            {genealogy.chronicle.length > 0 && (
              <>
                <p className="ink-genealogy-sub">跨世殘頁</p>
                <ul className="ink-genealogy-chronicle">
                  {genealogy.chronicle.slice(-6).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}

      {view === 'people' && (
        <>
          <h3>人際</h3>
          {lover ? <p className="ink-note">眷屬 · {lover.name}</p> : <p className="ink-note">尚未有眷屬。</p>}
          <p className="ink-note">
            子女 · {c.childrenCount ?? 0}
            {listChildNames(state).length ? `（${listChildNames(state).join('、')}）` : ''}
            {getHeirName(state) ? ` · 嗣「${getHeirName(state)}」` : ''}
          </p>
          <p className="ink-note">
            家族銀庫 {previewInheritanceMoney(state).toLocaleString('zh-Hant')} 兩、裝備 {familyGearCarry(state).length} 件 · 離世後全數傳後人
            {(c.childrenCount ?? 0) > 0 ? '' : '（無子女由旁支接班）'}
          </p>
          {c.loverId && (c.childrenCount ?? 0) === 0 && (
            <p className="ink-note">已有眷屬——可至修行「求子添丁」。</p>
          )}

        </>
      )}

      {view === 'combat' && (
        <>
          <h3>戰力 {combatRating(state).toLocaleString('zh-Hant')} · {combatRatingTier(combatRating(state))}</h3>
          <p className="ink-note">江湖排名：{jianghuRank(state) >= JIANGHU_RANK_START ? '未列名' : `第${jianghuRank(state)}位`} · 威望 {jianghuPrestige(state)}</p>
          <p className="ink-note">
            演武台實戰數值，由已裝備武學、修為境界、氣血上限及裝備計算。目前進度為第 {sparSavedStage(state)} 關。
          </p>

          <h3 className="ink-subhead">總覽</h3>
          <dl className="ink-combat-grid" aria-label="戰力總覽">
            <div>
              <dt>演武氣血</dt>
              <dd data-count={spar.stats.maxHp} data-fmt="num">
                {numText(spar.stats.maxHp)}
              </dd>
            </div>
            <div>
              <dt>攻擊</dt>
              <dd data-count={spar.stats.atk} data-fmt="num">
                {numText(spar.stats.atk)}
              </dd>
            </div>
            <div>
              <dt>暴擊率</dt>
              <dd data-count={spar.stats.critRate} data-fmt="pct">
                {pctText(spar.stats.critRate)}
              </dd>
            </div>
            <div>
              <dt>暴擊傷害</dt>
              <dd>×{spar.stats.critMul}</dd>
            </div>
            <div>
              <dt>吸血</dt>
              <dd data-count={spar.stats.lifesteal} data-fmt="pct">
                {pctText(spar.stats.lifesteal)}
              </dd>
            </div>
            <div>
              <dt>減傷</dt>
              <dd data-count={spar.stats.guard} data-fmt="pct">
                {pctText(spar.stats.guard)}
              </dd>
            </div>
          </dl>

          <h3 className="ink-subhead">境界倍率</h3>
          <ul className="ink-delta-board" aria-label="境界倍率">
            <li className="ink-delta-row ink-delta-row--up">
              <span className="ink-delta-row-text">
                {currentCultivationTier(state).name} · 氣血、攻擊 ×{spar.scale.toFixed(2)}（每升一境 ×{SPAR_TIER_SCALE}）
              </span>
            </li>
          </ul>

          <h3 className="ink-subhead">攻擊拆解</h3>
          <ul className="ink-delta-board" aria-label="攻擊拆解">
            <li className="ink-delta-row ink-delta-row--flat">
              <span className="ink-delta-row-text">基礎 ＋{numText(spar.atk.base)}</span>
            </li>
            <li className="ink-delta-row ink-delta-row--flat">
              <span className="ink-delta-row-text">武學 {numText(spar.martial)} × 1.6 ＋{numText(spar.atk.fromMartial)}</span>
            </li>
            <li className={`ink-delta-row ${spar.atk.fromWeapon > 0 ? 'ink-delta-row--up' : 'ink-delta-row--flat'}`}>
              <span className="ink-delta-row-text">兵器攻擊 {numText(spar.gearAttack)} × 3 ＋{numText(spar.atk.fromWeapon)}</span>
            </li>
            <li className="ink-delta-row ink-delta-row--flat">
              <strong className="ink-delta-row-text">
                小計 {numText(spar.atk.base + spar.atk.fromMartial + spar.atk.fromWeapon)} × 境界 {spar.scale.toFixed(2)} ＝ {numText(spar.stats.atk)}
              </strong>
            </li>
          </ul>

          <h3 className="ink-subhead">氣血拆解</h3>
          <ul className="ink-delta-board" aria-label="演武氣血拆解">
            <li className="ink-delta-row ink-delta-row--flat">
              <span className="ink-delta-row-text">角色氣血上限 {numText(c.maxHealth)} ＝ 演武氣血上限 {numText(spar.stats.maxHp)}</span>
            </li>
            <li className="ink-delta-row ink-delta-row--flat">
              <span className="ink-delta-row-text">武學及境界提升攻擊，演武氣血與角色氣血上限一致</span>
            </li>
            <li className="ink-delta-row ink-delta-row--flat">
              <strong className="ink-delta-row-text">
                戰力綜合攻擊、暴擊、氣血、減傷、內力及回復能力，不計威望或排名
              </strong>
            </li>
          </ul>

          <h3 className="ink-subhead">暴擊・吸血・減傷</h3>
          <ul className="ink-delta-board" aria-label="暴擊吸血減傷拆解">
            <li className="ink-delta-row ink-delta-row--flat">
              <span className="ink-delta-row-text">
                暴擊率：基礎 {pctText(spar.crit.base)} ＋ 膽識 {pctText(spar.crit.fromDanShi)} ＋ 悟性 {pctText(spar.crit.fromWuXing)}（上限 {pctText(spar.crit.cap)}）
              </span>
            </li>
            <li className={`ink-delta-row ${spar.stats.lifesteal > 0 ? 'ink-delta-row--up' : 'ink-delta-row--flat'}`}>
              <span className="ink-delta-row-text">
                吸血：
                {spar.stats.lifesteal > 0
                  ? `武學 ${pctText(spar.lifesteal.fromSkills)}${spar.lifesteal.skillNames.length ? `（${spar.lifesteal.skillNames.join('、')}）` : ''} ＋ 裝備 ${pctText(spar.lifesteal.fromGear)}（上限 ${pctText(spar.lifesteal.cap)}）`
                  : '未裝備吸血武學或吸血詞條，不會產生吸血效果'}
              </span>
            </li>
            <li className={`ink-delta-row ${spar.stats.killHeal > 0 ? 'ink-delta-row--up' : 'ink-delta-row--flat'}`}>
              <span className="ink-delta-row-text">
                擊倒回血：
                {spar.stats.killHeal > 0
                  ? `每擊倒一名敵人回復 ${pctText(spar.stats.killHeal)}（${spar.heal.skillNames.join('、')}）；過關一律回滿`
                  : '未裝備回血武學，關內不會回復氣血；過關時回復至上限'}
              </span>
            </li>
            <li className="ink-delta-row ink-delta-row--flat">
              <span className="ink-delta-row-text">
                減傷：裝備防禦 {numText(spar.gearDefense)} × 1.2% ＝ {pctText(spar.guard.fromArmor)}（上限 {pctText(spar.guard.cap)}）
              </span>
            </li>
          </ul>
        </>
      )}

      {view === 'achievements' && (
        <>
          <h3>成就</h3>
          <p className="ink-note">
            已錄 {achProgress.unlocked}/{achProgress.total}
            {nicknames.length ? ` · 綽號：${nicknames.join('、')}` : ''}
          </p>
          <ul className="ink-ach-list" aria-label="成就清單">
            {listAchievementStatus(state).map((a) => (
              <li
                key={a.id}
                className={`ink-ach-row${a.unlocked ? ' ink-ach-row--on' : ' ink-ach-row--off'}`}
              >
                <strong>{a.unlocked ? a.label : '？？'}</strong>
                <span>{a.unlocked ? '已記入卷首' : a.hint}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {view === 'roots' && (
        <>
          <h3>江湖根腳</h3>
          <p className="ink-note">
            行當 · {careerLabel(state)}
            {getCareer(state) ? `（月利約${getCareer(state)!.income}兩）` : ''}
          </p>
          <p className="ink-note">
            {getMasterName(state)
              ? `業師「${getMasterName(state)}」${c.flags.master_severed ? '（已斷）' : ''}`
              : '尚未拜師'}
            {c.flags.lover_dual_done ? ' · 俠侶相守' : ''}
            {c.flags.lover_severed ? ' · 舊情已斷' : ''}
          </p>
          {sect ? <p className="ink-note">門派 · {sect.name}</p> : <p className="ink-note">尚未入派</p>}
          {listWeaponMasteries(state).length > 0 && (
            <p className="ink-note">
              兵刃專精 ·{' '}
              {listWeaponMasteries(state)
                .map((m) => `${m.label}${m.level}境`)
                .join(' · ')}
            </p>
          )}
          {formatFragmentProgress(state).length > 0 && (
            <>
              <h3 className="ink-subhead">殘譜進度</h3>
              <ul className="ink-delta-board ink-playability-board">
                {formatFragmentProgress(state).map((line) => (
                  <li key={line} className="ink-delta-row ink-delta-row--flat">
                    <span className="ink-delta-row-text">{line}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      </div>
    </section>
    </InkPersonNativeContext.Provider>
  );
}
