import { createPortal } from 'react-dom';
import { getSkillDef, skillKindLabel, skillLabel } from '@data/skills/catalog';
import { volumeLabel } from '@data/skills/volumes';
import { TRIAL_LABEL, ENCOUNTER_OFFER_HOURS } from '@data/redesign/encounters';
import { encounterRoute, encounterTemplate, encounterTimeLeft, formatTimeLeft } from '@core/life/encounters';
import { useAncestryStore } from '../../store/ancestryStore';
import { sealUrlForText } from '../../ui/inkAssets';

/**
 * 在線奇遇彈窗（design/agreed-design-2026-10.md §3.3）：
 *   彈出 → 揀第一個決定（開始計 1–3 日）；或者領傳承結果。
 */
export function InkEncounterModal({ onLearn }: { onLearn: (id: string) => void }) {
  const meta = useAncestryStore((s) => s.meta);
  const reward = useAncestryStore((s) => s.encounterReward);
  const choose = useAncestryStore((s) => s.chooseEncounter);
  const dismiss = useAncestryStore((s) => s.dismissEncounter);
  const setOpen = useAncestryStore((s) => s.setEncounterOpen);
  const clearReward = useAncestryStore((s) => s.clearEncounterReward);
  const e = meta.encounter;
  const seal = sealUrlForText('緣');
  const close = () => {
    clearReward();
    setOpen(false);
  };

  if (reward) {
    const def = getSkillDef(reward);
    return createPortal(
      <div className="ink-modal ink-enc" role="dialog" aria-modal="true" aria-label="奇遇傳承" onClick={close}>
        <div className="ink-modal-card ink-enc-card is-reward" onClick={(ev) => ev.stopPropagation()}>
          <p className="ink-enc-kicker">奇遇 · 得傳承</p>
          <h3 className="ink-enc-title">
            「{meta.encounter?.last?.vol ? volumeLabel(reward, meta.encounter.last.vol) : skillLabel(reward)}」
          </h3>
          <p className="ink-enc-meta">
            珍本奇功 · {def ? skillKindLabel(def.kind) : ''}
          </p>
          <p className="ink-enc-story">{def?.flavor}</p>
          <p className="ink-note">已入家族收藏，每代都可以學。</p>
          <div className="ink-enc-actions">
            <button type="button" className="ink-enc-btn is-main" onClick={() => { onLearn(reward); close(); }}>
              即刻學
            </button>
            <button type="button" className="ink-enc-btn" onClick={close}>
              遲啲先
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  const tpl = encounterTemplate(e?.offer?.tpl);
  if (!e?.offer || !tpl) return null;
  return createPortal(
    <div className="ink-modal ink-enc" role="dialog" aria-modal="true" aria-label={`奇遇：${tpl.title}`} onClick={() => setOpen(false)}>
      <div className="ink-modal-card ink-enc-card" onClick={(ev) => ev.stopPropagation()}>
        {seal && <img className="ink-enc-seal" src={seal} alt="" draggable={false} />}
        <p className="ink-enc-kicker">奇遇</p>
        <h3 className="ink-enc-title">{tpl.title}</h3>
        <p className="ink-enc-story">{tpl.story}</p>
        <ul className="ink-enc-routes">
          {tpl.routes.map((r) => (
            <li key={r.id}>
              <button type="button" className="ink-enc-route" onClick={() => choose(r.id)}>
                <span className="ink-enc-route-label">{r.label}</span>
                <span className="ink-enc-route-trial">
                  {r.trialName}：{TRIAL_LABEL[r.trial].verb} {r.target} {TRIAL_LABEL[r.trial].unit} · 限 {r.days} 日
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="ink-enc-note">
          揀咗先開始計限期（離線時間照計）；過期乜都冇。唔揀嘅話 {ENCOUNTER_OFFER_HOURS} 個鐘後散（剩 {formatTimeLeft(encounterTimeLeft(meta, Date.now()))}）。
        </p>
        <div className="ink-enc-actions">
          <button type="button" className="ink-enc-btn" onClick={() => setOpen(false)}>
            遲啲再揀
          </button>
          <button type="button" className="ink-enc-btn is-quiet" onClick={dismiss}>
            唔理
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** 主畫面奇遇卡：未揀／進行中（進度＋剩餘時間）／可領傳承 */
export function InkEncounterCard() {
  const meta = useAncestryStore((s) => s.meta);
  const setOpen = useAncestryStore((s) => s.setEncounterOpen);
  const claim = useAncestryStore((s) => s.claimEncounter);
  const e = meta.encounter;
  const now = Date.now();
  if (e?.offer) {
    const tpl = encounterTemplate(e.offer.tpl);
    return (
      <button type="button" className="ink-enc-strip is-offer" onClick={() => setOpen(true)}>
        <span className="ink-enc-strip-kicker">奇遇</span>
        <span className="ink-enc-strip-title">{tpl?.title} · 等你揀</span>
        <span className="ink-enc-strip-time">剩 {formatTimeLeft(encounterTimeLeft(meta, now))}</span>
      </button>
    );
  }
  if (!e?.active) return null;
  const tpl = encounterTemplate(e.active.tpl);
  const route = encounterRoute(e.active.tpl, e.active.route);
  if (!tpl || !route) return null;
  const done = e.active.progress >= route.target;
  const pct = Math.min(100, (e.active.progress / route.target) * 100);
  return (
    <div className={`ink-enc-strip${done ? ' is-done' : ''}`}>
      <div className="ink-enc-strip-main">
        <span className="ink-enc-strip-kicker">奇遇 · {route.trialName}</span>
        <span className="ink-enc-strip-title">
          {tpl.title}：{TRIAL_LABEL[route.trial].verb} {e.active.progress}／{route.target} {TRIAL_LABEL[route.trial].unit}
        </span>
        <span className="ink-enc-strip-bar" style={{ ['--fill' as string]: `${pct}%` }} />
        <span className="ink-enc-strip-time">{done ? '考驗完成！' : `限期剩 ${formatTimeLeft(encounterTimeLeft(meta, now))}`}</span>
      </div>
      {done && (
        <button type="button" className="ink-enc-claim" onClick={() => claim()}>
          領傳承
        </button>
      )}
    </div>
  );
}
