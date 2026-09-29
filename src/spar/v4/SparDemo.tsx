/**
 * 演武台示範頁：?fx=spar
 * 切換門派服色、兵器、境界（敵人）、護甲／飾物、傷勢／流血、地點、季節，撳「下個頭目」即刻出頭目。
 * 可加 &sect= &weapon= &tier= &place= &season= &boss=1 &limp=1 &arm=1 &bleed=1 &armor=1 &acc=1 預設（截圖用）。
 */
import { useState } from 'react';
import type { WeaponKind } from '@data/equipment/catalog';
import { SECT_ROBE_COLORS, type SparPlace, type SparSeason } from '@data/spar/tuning';
import { SparView } from './SparView';
import { DEFAULT_LOOK, type SparLook } from './look';

const SECTS: [string, string][] = [
  ['none', '浪人'],
  ['sect_wudang', '武當'],
  ['sect_shaolin', '少林'],
  ['sect_emei', '峨嵋'],
  ['sect_qingyun', '青雲'],
  ['sect_tiandao', '天刀'],
  ['sect_tangmen', '唐門'],
  ['sect_mojiao', '魔教'],
  ['sect_huashan', '華山'],
  ['sect_taohua', '桃花'],
  ['sect_wugen', '無根'],
];
const WEAPONS: [WeaponKind | 'none', string][] = [
  ['sword', '劍'],
  ['blade', '刀'],
  ['spear', '槍'],
  ['staff', '棍'],
  ['whip', '鞭'],
  ['bow', '弓'],
  ['hidden', '暗器'],
  ['none', '空手'],
];
const PLACES: [SparPlace, string][] = [
  ['town', '鎮'],
  ['river', '河'],
  ['mountain', '山'],
  ['hall', '館'],
  ['wild', '野'],
];
const SEASONS: [SparSeason, string][] = [
  ['spring', '春'],
  ['summer', '夏'],
  ['autumn', '秋'],
  ['winter', '冬'],
];

export default function SparDemo() {
  const q = new URLSearchParams(window.location.search);
  const [sect, setSect] = useState(q.get('sect') ?? 'none');
  const [look, setLook] = useState<SparLook>(() => ({
    ...DEFAULT_LOOK,
    robe: SECT_ROBE_COLORS[q.get('sect') ?? 'none'] ?? DEFAULT_LOOK.robe,
    weapon: q.get('weapon') === 'none' ? null : ((q.get('weapon') as WeaponKind) ?? 'sword'),
    enemyTier: Number(q.get('tier') ?? 1),
    place: (q.get('place') as SparPlace) ?? 'town',
    season: (q.get('season') as SparSeason) ?? 'spring',
    limp: q.get('limp') === '1',
    armHurt: q.get('arm') === '1',
    hunch: q.get('hunch') === '1',
    bleeding: q.get('bleed') === '1',
    armor: q.get('armor') === '1',
    accessory: q.get('acc') === '1',
  }));
  const [xp, setXp] = useState(0);
  const [boss, setBoss] = useState(q.get('boss') === '1' ? 1 : 0);
  const set = (p: Partial<SparLook>) => setLook((l) => ({ ...l, ...p }));
  const toggle = (k: keyof SparLook, label: string) => (
    <label style={{ whiteSpace: 'nowrap' }}>
      <input type="checkbox" checked={!!look[k]} onChange={(e) => set({ [k]: e.target.checked } as Partial<SparLook>)} />
      {label}
    </label>
  );
  const row: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', fontSize: 13 };
  return (
    <div className="scroll-shell" style={{ gap: 10 }}>
      <h2 style={{ margin: 0 }}>演武台示範</h2>
      <div style={row}>
        <select value={sect} onChange={(e) => (setSect(e.target.value), set({ robe: SECT_ROBE_COLORS[e.target.value]! }))}>
          {SECTS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select value={look.weapon ?? 'none'} onChange={(e) => set({ weapon: e.target.value === 'none' ? null : (e.target.value as WeaponKind) })}>
          {WEAPONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select value={look.enemyTier} onChange={(e) => set({ enemyTier: Number(e.target.value) })}>
          {[1, 2, 3, 4, 5, 6].map((t) => (
            <option key={t} value={t}>
              敵人 {t} 級
            </option>
          ))}
        </select>
        <select value={look.place} onChange={(e) => set({ place: e.target.value as SparPlace })}>
          {PLACES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select value={look.season} onChange={(e) => set({ season: e.target.value as SparSeason })}>
          {SEASONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setBoss((n) => n + 1)}>
          下個頭目
        </button>
      </div>
      <div style={row}>
        {toggle('armor', '護甲')}
        {toggle('accessory', '飾物')}
        {toggle('limp', '腳傷')}
        {toggle('armHurt', '手傷')}
        {toggle('hunch', '重傷')}
        {toggle('bleeding', '流血')}
      </div>
      <div className="ink-home-focus" style={{ flex: 1 }}>
        <div className="ink-home-scene">
          <SparView look={look} bossSignal={boss} onStrike={() => (setXp((x) => x + 3), 3)}>
            <p className="ink-spar-caption">
              <span>示範 · 撳敵人即刻出手</span>
              <strong>演武台</strong>
            </p>
          </SparView>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <span className="ink-nav-center-xp" style={{ display: 'inline-block', padding: '4px 14px', border: '1px solid #ccc', borderRadius: 16 }}>
          修為 {xp}
        </span>
      </div>
    </div>
  );
}
