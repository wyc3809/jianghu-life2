import type { LifeGameState } from '@interfaces/lifeEngine';
import type { AncestryMeta } from '@interfaces/ancestry';
import { useRef } from 'react';
import { canonicalSkillId, getSkillDef, skillKindLabel, skillLabel } from '@data/skills/catalog';
import { ownedVolumes, collectionVolumes } from '@core/life/volumes';
import { equippedMartialArts, INTERNAL_ART_SLOT, QINGGONG_ART_SLOT } from '@core/life/martialLoadout';
import { hasVolumes, VOLUME_NUMERALS } from '@data/skills/volumes';
import { rankName } from '@core/life/martialRanks';
import { codexCoverUrl } from '../../fx/highlight/codexAppearance';
import { GachaSheet } from './InkGachaReveal';

type Props = {
  state: LifeGameState;
  collection: AncestryMeta;
  slot: number;
  preset: 'normal' | 'duel';
  busy: boolean;
  onEquip: (id: string) => boolean;
  onClose: () => void;
};

/** 先指定欄位再選武學；關閉只返回原頁，確認才沿用既有學習／裝備核心。 */
export function InkMartialPicker({ state, collection, slot, preset, busy, onEquip, onClose }: Props) {
  const submitted = useRef(false);
  const c = state.character;
  const kind = slot === INTERNAL_ART_SLOT ? 'internal' : slot === QINGGONG_ART_SLOT ? 'qinggong' : 'external';
  const target = kind === 'external' ? `外功欄位${slot + 1}` : kind === 'internal' ? '內功欄位' : '身法欄位';
  const title = kind === 'external' ? '選擇外功' : kind === 'internal' ? '選擇內功' : '選擇身法';
  const ids = [...new Set([...c.skills, ...Object.keys(collection.manuals ?? {})])];
  const seen = new Set<string>();
  const candidates = ids.filter(id => {
    const key = canonicalSkillId(id);
    if (getSkillDef(id)?.kind !== kind || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const equipped = new Set(equippedMartialArts(c).map(canonicalSkillId));
  return <GachaSheet title={title} onClose={onClose}>
    <p className="ink-martial-picker-context">{preset === 'duel' ? '對戰配搭' : '普通配搭'} · {target}</p>
    <p className="ink-note">{kind === 'external' ? '選擇一門外功，按欄位次序輪替，依已得卷次連招。' : '此為獨立欄位，不佔五門外功名額。'}可跨流派配搭。</p>
    {candidates.length === 0 ? <p className="ink-note">尚無可裝備的{skillKindLabel(kind)}，可前往秘笈閣取得。</p> :
      <ul className="ink-martial-picker-list">{candidates.map(id => {
        const def = getSkillDef(id)!;
        const learned = c.skills.includes(id);
        const volumes = learned ? ownedVolumes(c, id) : collectionVolumes(collection, id);
        const active = equipped.has(canonicalSkillId(id));
        return <li key={id} data-art-id={id} data-premium={def.premium ? '1' : '0'}>
          <img src={codexCoverUrl(def.premium === true)} alt="" width="44" height="66" />
          <div className="ink-martial-picker-info"><strong>{skillLabel(id)}</strong>
            <span>{def.premium ? '珍本' : '江湖'} · {learned ? rankName(c.skillRanks[id] ?? 0) : '收藏 · 未習得'}</span>
            {hasVolumes(id) ? <span>已得{volumes.length}／7卷 · 整套耗內{def.move?.qiCost ?? 0}</span> : <span>{skillKindLabel(kind)} · 獨立欄位</span>}
            {hasVolumes(id) && <span className="ink-martial-picker-volumes">{volumes.map(v => `卷${VOLUME_NUMERALS[v - 1]}`).join('、')}</span>}
            {active ? <span className="ink-martial-picker-equipped">已裝備於此套</span> : <button type="button" className="ink-btn ink-btn--primary"
              disabled={busy} aria-label={`裝備${skillLabel(id)}至${target}`}
              onClick={() => {
                if (submitted.current) return;
                submitted.current = true;
                if (!onEquip(id)) submitted.current = false;
              }}>{`裝備至${target}`}</button>}
          </div>
        </li>;
      })}</ul>}
  </GachaSheet>;
}
