import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { InkScrollBackdrop } from './InkDecor';
import { rawCatalog, getRawEventById } from '@core/life/eventEngine';
import { eventMatchesEditorQuery } from '@core/life/eventEditorScope';
import {
  type ChoicePatch,
  type EventPatch,
  clearAllEventPatches,
  draftPatchFromEvent,
  exportEventOverrideStore,
  getEventOverrideStore,
  importEventOverrideStore,
  listPatchedEventIds,
  loadEventOverrides,
  removeEventPatch,
  saveEventPatch,
  subscribeEventOverrides,
} from '@core/life/eventOverrides';
import {
  GEAR_CATALOG,
  getBaseGearDef,
  getGearDef,
  rarityLabel,
  type GearRarity,
} from '@data/equipment/catalog';
import { SLOT_LABEL } from '@data/equipment/affixes';
import {
  type GearPatch,
  clearAllGearPatches,
  draftPatchFromGear,
  exportGearOverrideStore,
  getGearOverrideStore,
  importGearOverrideStore,
  listPatchedGearIds,
  loadGearOverrides,
  removeGearPatch,
  saveGearPatch,
  subscribeGearOverrides,
} from '@data/equipment/overrides';

type Props = {
  onClose: () => void;
};

type EditorTab = 'events' | 'gear' | 'results';

type Filter = 'all' | 'patched' | 'special' | 'ordinary';
type GearFilter = 'all' | 'patched' | GearRarity;

function useOverrideTick() {
  return useSyncExternalStore(
    subscribeEventOverrides,
    () => getEventOverrideStore().updatedAt,
    () => 0,
  );
}

function useGearOverrideTick() {
  return useSyncExternalStore(
    subscribeGearOverrides,
    () => getGearOverrideStore().updatedAt,
    () => 0,
  );
}

function numOrEmpty(v: number | undefined): string {
  return v === undefined || Number.isNaN(v) ? '' : String(v);
}

function parseOptionalFloat(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function parseOptionalInt(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

function isSpecialEvent(id: string, tags?: string[]): boolean {
  if (tags?.includes('special') || tags?.includes('secret') || tags?.includes('boss')) return true;
  return /^(secret_|boss_|jy_|jx_|pack_)/.test(id);
}

/** 每則已改事件入邊，帶「結果敘事」補丁嘅選項——供「結果文案」總覽用 */
type PatchedResultRow = {
  eventId: string;
  eventTitle: string;
  choiceId: string;
  choiceLabel: string;
  narrate: string;
};

function collectPatchedResults(): PatchedResultRow[] {
  loadEventOverrides();
  const store = getEventOverrideStore();
  const rows: PatchedResultRow[] = [];
  for (const [eventId, patch] of Object.entries(store.patches)) {
    const raw = getRawEventById(eventId);
    if (!patch.choices) continue;
    for (const [choiceId, cp] of Object.entries(patch.choices)) {
      if (!cp.narrate) continue;
      const rawChoice = raw?.choices.find((c) => c.id === choiceId);
      rows.push({
        eventId,
        eventTitle: patch.title ?? raw?.title ?? eventId,
        choiceId,
        choiceLabel: cp.text ?? rawChoice?.text ?? choiceId,
        narrate: cp.narrate,
      });
    }
  }
  return rows;
}

export function InkEventEditor({ onClose }: Props) {
  const tick = useOverrideTick();
  const gearTick = useGearOverrideTick();
  const [tab, setTab] = useState<EditorTab>('events');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventPatch | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [gearQ, setGearQ] = useState('');
  const [gearFilter, setGearFilter] = useState<GearFilter>('all');
  const [selectedGearId, setSelectedGearId] = useState<string | null>(null);
  const [gearDraft, setGearDraft] = useState<GearPatch | null>(null);

  useEffect(() => {
    loadEventOverrides();
    loadGearOverrides();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const patchedSet = useMemo(() => new Set(listPatchedEventIds()), [tick]);

  const catalog = useMemo(() => rawCatalog(), []);

  const filtered = useMemo(() => {
    return catalog.filter((ev) => {
      if (filter === 'patched' && !patchedSet.has(ev.id)) return false;
      if (filter === 'special' && !isSpecialEvent(ev.id, ev.tags)) return false;
      if (filter === 'ordinary' && isSpecialEvent(ev.id, ev.tags)) return false;
      return eventMatchesEditorQuery(ev, q);
    });
  }, [catalog, q, filter, patchedSet]);

  useEffect(() => {
    if (!selectedId) {
      setDraft(null);
      return;
    }
    const raw = getRawEventById(selectedId);
    if (!raw) {
      setDraft(null);
      return;
    }
    setDraft(draftPatchFromEvent(raw));
  }, [selectedId, tick]);

  const patchedGearSet = useMemo(() => new Set(listPatchedGearIds()), [gearTick]);

  const filteredGear = useMemo(() => {
    const query = gearQ.trim();
    return GEAR_CATALOG.filter((base) => {
      if (gearFilter === 'patched' && !patchedGearSet.has(base.id)) return false;
      if (gearFilter !== 'all' && gearFilter !== 'patched' && base.rarity !== gearFilter) return false;
      if (!query) return true;
      const live = getGearDef(base.id);
      return (
        base.id.includes(query) ||
        base.name.includes(query) ||
        (live?.name ?? '').includes(query) ||
        base.description.includes(query)
      );
    });
  }, [gearQ, gearFilter, patchedGearSet, gearTick]);

  useEffect(() => {
    if (!selectedGearId) {
      setGearDraft(null);
      return;
    }
    const base = getBaseGearDef(selectedGearId);
    if (!base) {
      setGearDraft(null);
      return;
    }
    setGearDraft(draftPatchFromGear(base));
  }, [selectedGearId, gearTick]);

  const patchedResults = useMemo(() => collectPatchedResults(), [tick]);

  const flash = (msg: string) => setToast(msg);

  const updateChoice = (choiceId: string, patch: Partial<ChoicePatch>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const cur = prev.choices?.[choiceId] ?? {};
      return {
        ...prev,
        choices: {
          ...(prev.choices ?? {}),
          [choiceId]: { ...cur, ...patch },
        },
      };
    });
  };

  const handleSave = () => {
    if (!selectedId || !draft) return;
    saveEventPatch(selectedId, draft);
    flash('已存本地 · 下月抽卡即生效');
  };

  const handleRevert = () => {
    if (!selectedId) return;
    removeEventPatch(selectedId);
    const raw = getRawEventById(selectedId);
    if (raw) setDraft(draftPatchFromEvent(raw));
    flash('已還原此事件');
  };

  const handleExport = async () => {
    const text = exportEventOverrideStore();
    try {
      if (navigator.share) {
        const file = new File([text], 'jianghu-event-overrides.json', { type: 'application/json' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: '江湖事件覆寫' });
          flash('已分享覆寫檔');
          return;
        }
        await navigator.share({ text, title: '江湖事件覆寫' });
        flash('已分享文字');
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(text);
      flash('已複製到剪貼簿');
    } catch {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jianghu-event-overrides.json';
      a.click();
      URL.revokeObjectURL(url);
      flash('已下載 JSON');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json,text/plain';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        const res = importEventOverrideStore(parsed);
        flash(res.ok ? `已匯入 ${res.count} 則` : res.error);
      } catch (e) {
        flash(e instanceof Error ? e.message : '匯入失敗');
      } finally {
        setBusy(false);
      }
    };
    input.click();
  };

  const handlePasteImport = async () => {
    const text = window.prompt('貼上覆寫 JSON（version:1 + patches）');
    if (!text?.trim()) return;
    try {
      const res = importEventOverrideStore(JSON.parse(text));
      flash(res.ok ? `已匯入 ${res.count} 則` : res.error);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'JSON 無效');
    }
  };

  const handleClearAll = () => {
    if (!window.confirm('清空全部本地覆寫？原版事件會恢復。')) return;
    clearAllEventPatches();
    if (selectedId) {
      const raw = getRawEventById(selectedId);
      if (raw) setDraft(draftPatchFromEvent(raw));
    }
    flash('已清空覆寫');
  };

  const handleGearSave = () => {
    if (!selectedGearId || !gearDraft) return;
    saveGearPatch(selectedGearId, gearDraft);
    flash('已存本地 · 立即生效（含戰鬥數值）');
  };

  const handleGearRevert = () => {
    if (!selectedGearId) return;
    removeGearPatch(selectedGearId);
    const base = getBaseGearDef(selectedGearId);
    if (base) setGearDraft(draftPatchFromGear(base));
    flash('已還原此裝備');
  };

  const handleGearExport = async () => {
    const text = exportGearOverrideStore();
    try {
      if (navigator.share) {
        const file = new File([text], 'jianghu-gear-overrides.json', { type: 'application/json' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: '江湖裝備覆寫' });
          flash('已分享覆寫檔');
          return;
        }
        await navigator.share({ text, title: '江湖裝備覆寫' });
        flash('已分享文字');
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(text);
      flash('已複製到剪貼簿');
    } catch {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jianghu-gear-overrides.json';
      a.click();
      URL.revokeObjectURL(url);
      flash('已下載 JSON');
    }
  };

  const handleGearImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json,text/plain';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        const res = importGearOverrideStore(parsed);
        flash(res.ok ? `已匯入 ${res.count} 則` : res.error);
      } catch (e) {
        flash(e instanceof Error ? e.message : '匯入失敗');
      } finally {
        setBusy(false);
      }
    };
    input.click();
  };

  const handleGearPasteImport = async () => {
    const text = window.prompt('貼上裝備覆寫 JSON（version:1 + patches）');
    if (!text?.trim()) return;
    try {
      const res = importGearOverrideStore(JSON.parse(text));
      flash(res.ok ? `已匯入 ${res.count} 則` : res.error);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'JSON 無效');
    }
  };

  const handleGearClearAll = () => {
    if (!window.confirm('清空全部本地裝備覆寫？原版數值會恢復。')) return;
    clearAllGearPatches();
    if (selectedGearId) {
      const base = getBaseGearDef(selectedGearId);
      if (base) setGearDraft(draftPatchFromGear(base));
    }
    flash('已清空覆寫');
  };

  const rawSelected = selectedId ? getRawEventById(selectedId) : undefined;
  const baseGearSelected = selectedGearId ? getBaseGearDef(selectedGearId) : undefined;
  const isEpicPlusGear =
    baseGearSelected?.rarity === 'epic' || baseGearSelected?.rarity === 'mythic' || baseGearSelected?.rarity === 'divine';

  return (
    <div className="scroll-shell ink-enter ink-editor">
      <InkScrollBackdrop variant="play" />
      <header className="ink-editor-head">
        <button type="button" className="ink-btn ink-btn--quiet ink-editor-back" onClick={onClose}>
          回卷
        </button>
        <div>
          <h1 className="ink-editor-title">內容編修</h1>
          <p className="ink-editor-sub">
            {tab === 'events'
              ? `改標題／正文／選項／數值 · 存手機本地 · 已改 ${patchedSet.size} 則`
              : tab === 'gear'
                ? `改裝備數值／特效／文案 · 存手機本地 · 已改 ${patchedGearSet.size} 件`
                : `全面檢視各事件已改嘅結果敘事 · 共 ${patchedResults.length} 條`}
          </p>
        </div>
      </header>

      <div className="ink-editor-filters" role="tablist" aria-label="編修分頁">
        {(
          [
            ['events', '事件'],
            ['gear', '裝備'],
            ['results', '結果文案'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`ink-tab${tab === id ? ' ink-tab--active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'events' && (
        <>

      {!selectedId ? (
        <>
          <label className="ink-field">
            <span>搜尋</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="標題、選項、正文或 id"
              enterKeyHint="search"
            />
          </label>
          <div className="ink-editor-filters" role="tablist" aria-label="篩選">
            {(
              [
                ['all', '全部'],
                ['patched', '已改'],
                ['special', '奇遇'],
                ['ordinary', '日常'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={filter === id}
                className={`ink-tab${filter === id ? ' ink-tab--active' : ''}`}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ink-editor-toolbar">
            <button type="button" className="ink-btn ink-btn--ghost" disabled={busy} onClick={() => void handleExport()}>
              匯出
            </button>
            <button type="button" className="ink-btn ink-btn--ghost" disabled={busy} onClick={handleImport}>
              匯入檔
            </button>
            <button type="button" className="ink-btn ink-btn--quiet" disabled={busy} onClick={() => void handlePasteImport()}>
              貼上
            </button>
            <button type="button" className="ink-btn ink-btn--quiet" onClick={handleClearAll}>
              清空
            </button>
          </div>
          <ul className="ink-editor-list">
            {filtered.slice(0, 200).map((ev) => (
              <li key={ev.id}>
                <button type="button" className="ink-editor-row" onClick={() => setSelectedId(ev.id)}>
                  <span className="ink-editor-row-title">
                    {ev.title}
                    {patchedSet.has(ev.id) ? <em className="ink-editor-badge">改</em> : null}
                  </span>
                  <span className="ink-editor-row-id">{ev.id}</span>
                </button>
              </li>
            ))}
          </ul>
          {filtered.length > 200 ? (
            <p className="ink-note">只顯示前 200 則，請再收窄搜尋。</p>
          ) : filtered.length === 0 ? (
            <p className="ink-note">無符合事件。</p>
          ) : null}
        </>
      ) : (
        <>
          <button type="button" className="ink-btn ink-btn--quiet" onClick={() => setSelectedId(null)}>
            ← 事件列表
          </button>
          <p className="ink-editor-id">{selectedId}</p>
          {draft && rawSelected ? (
            <div className="ink-editor-form">
              <label className="ink-field">
                <span>標題</span>
                <input
                  value={draft.title ?? ''}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </label>
              <label className="ink-field">
                <span>正文</span>
                <textarea
                  className="ink-editor-textarea"
                  rows={4}
                  value={draft.body ?? ''}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                />
              </label>
              <label className="ink-field">
                <span>抽中權重（越大越易抽到；0＝停用）</span>
                <input
                  inputMode="numeric"
                  value={numOrEmpty(draft.weight)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      weight: parseOptionalInt(e.target.value) ?? 0,
                    })
                  }
                />
              </label>
              <label className="ink-editor-check">
                <input
                  type="checkbox"
                  checked={Boolean(draft.disabled)}
                  onChange={(e) => setDraft({ ...draft, disabled: e.target.checked })}
                />
                <span>停用此事件</span>
              </label>

              {rawSelected.choices.map((ch) => {
                const cp = draft.choices?.[ch.id] ?? {};
                return (
                  <fieldset key={ch.id} className="ink-editor-choice">
                    <legend>選項 · {ch.id}</legend>
                    <label className="ink-field">
                      <span>按鈕文字</span>
                      <input
                        value={cp.text ?? ''}
                        onChange={(e) => updateChoice(ch.id, { text: e.target.value })}
                      />
                    </label>
                    <label className="ink-field">
                      <span>結果敘事</span>
                      <textarea
                        className="ink-editor-textarea"
                        rows={3}
                        value={cp.narrate ?? ''}
                        onChange={(e) => updateChoice(ch.id, { narrate: e.target.value })}
                      />
                    </label>
                    <div className="ink-editor-nums">
                      {(
                        [
                          ['money', '銀兩'],
                          ['health', '氣血'],
                          ['martial', '武學'],
                          ['reputation', '聲望'],
                          ['qi', '內力'],
                          ['maxQi', '內力上限'],
                          ['maxHealth', '氣血上限'],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="ink-field">
                          <span>{label}</span>
                          <input
                            inputMode="numeric"
                            value={numOrEmpty(cp[key])}
                            onChange={(e) => updateChoice(ch.id, { [key]: parseOptionalInt(e.target.value) })}
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}

              <div className="ink-cta-stack">
                <button type="button" className="ink-btn ink-btn--primary" onClick={handleSave}>
                  儲存此事件
                </button>
                <button type="button" className="ink-btn ink-btn--ghost" onClick={handleRevert}>
                  還原官方版
                </button>
              </div>
            </div>
          ) : (
            <p className="ink-note">找不到此事件。</p>
          )}
        </>
      )}
        </>
      )}

      {tab === 'gear' && (
        <>
          {!selectedGearId ? (
            <>
              <label className="ink-field">
                <span>搜尋</span>
                <input
                  value={gearQ}
                  onChange={(e) => setGearQ(e.target.value)}
                  placeholder="名稱、描述或 id"
                  enterKeyHint="search"
                />
              </label>
              <div className="ink-editor-filters" role="tablist" aria-label="裝備篩選">
                {(
                  [
                    ['all', '全部'],
                    ['patched', '已改'],
                    ['common', rarityLabel.common],
                    ['fine', rarityLabel.fine],
                    ['rare', rarityLabel.rare],
                    ['epic', rarityLabel.epic],
                    ['mythic', rarityLabel.mythic],
                    ['divine', rarityLabel.divine],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={gearFilter === id}
                    className={`ink-tab${gearFilter === id ? ' ink-tab--active' : ''}`}
                    onClick={() => setGearFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="ink-editor-toolbar">
                <button type="button" className="ink-btn ink-btn--ghost" disabled={busy} onClick={() => void handleGearExport()}>
                  匯出
                </button>
                <button type="button" className="ink-btn ink-btn--ghost" disabled={busy} onClick={handleGearImport}>
                  匯入檔
                </button>
                <button type="button" className="ink-btn ink-btn--quiet" disabled={busy} onClick={() => void handleGearPasteImport()}>
                  貼上
                </button>
                <button type="button" className="ink-btn ink-btn--quiet" onClick={handleGearClearAll}>
                  清空
                </button>
              </div>
              <ul className="ink-editor-list">
                {filteredGear.map((base) => {
                  const live = getGearDef(base.id)!;
                  return (
                    <li key={base.id}>
                      <button
                        type="button"
                        className="ink-editor-row"
                        onClick={() => setSelectedGearId(base.id)}
                      >
                        <span className="ink-editor-row-title">
                          {live.name}
                          {patchedGearSet.has(base.id) ? <em className="ink-editor-badge">改</em> : null}
                        </span>
                        <span className="ink-editor-row-id">
                          {rarityLabel[base.rarity]} · {SLOT_LABEL[base.slot]} · {base.id}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {filteredGear.length === 0 ? <p className="ink-note">無符合裝備。</p> : null}
            </>
          ) : (
            <>
              <button type="button" className="ink-btn ink-btn--quiet" onClick={() => setSelectedGearId(null)}>
                ← 裝備列表
              </button>
              <p className="ink-editor-id">
                {selectedGearId} · {baseGearSelected ? rarityLabel[baseGearSelected.rarity] : ''}
              </p>
              {gearDraft && baseGearSelected ? (
                <div className="ink-editor-form">
                  <label className="ink-field">
                    <span>名稱</span>
                    <input
                      value={gearDraft.name ?? ''}
                      onChange={(e) => setGearDraft({ ...gearDraft, name: e.target.value })}
                    />
                  </label>
                  <label className="ink-field">
                    <span>描述</span>
                    <textarea
                      className="ink-editor-textarea"
                      rows={3}
                      value={gearDraft.description ?? ''}
                      onChange={(e) => setGearDraft({ ...gearDraft, description: e.target.value })}
                    />
                  </label>
                  <div className="ink-editor-nums">
                    {(
                      [
                        ['attack', '威'],
                        ['defense', '禦'],
                        ['maxHpBonus', '氣血上限'],
                        ['maxQiBonus', '內息上限'],
                        ['martialBonus', '武學'],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="ink-field">
                        <span>{label}</span>
                        <input
                          inputMode="numeric"
                          value={numOrEmpty(gearDraft[key])}
                          onChange={(e) =>
                            setGearDraft({ ...gearDraft, [key]: parseOptionalInt(e.target.value) })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <fieldset className="ink-editor-choice">
                    <legend>戰鬥特效（百分比，0–1）</legend>
                    <div className="ink-editor-nums">
                      {(
                        [
                          ['hitBonus', '命中'],
                          ['evasion', '身法'],
                          ['reflect', '反震'],
                          ['pierce', '破甲'],
                          ['lifesteal', '吸血'],
                          ['bleedChance', '見血'],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="ink-field">
                          <span>{label}</span>
                          <input
                            inputMode="decimal"
                            value={numOrEmpty(gearDraft.combat?.[key])}
                            onChange={(e) =>
                              setGearDraft({
                                ...gearDraft,
                                combat: { ...gearDraft.combat, [key]: parseOptionalFloat(e.target.value) },
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {isEpicPlusGear && (
                    <fieldset className="ink-editor-choice">
                      <legend>獨特效果（紫／橙／紅專屬）</legend>
                      <label className="ink-field">
                        <span>效果名</span>
                        <input
                          value={gearDraft.special?.name ?? ''}
                          onChange={(e) =>
                            setGearDraft({
                              ...gearDraft,
                              special: {
                                kind: gearDraft.special?.kind ?? 'burst',
                                name: e.target.value,
                                description: gearDraft.special?.description ?? '',
                                chance: gearDraft.special?.chance,
                                power: gearDraft.special?.power,
                              },
                            })
                          }
                        />
                      </label>
                      <label className="ink-field">
                        <span>效果描述</span>
                        <textarea
                          className="ink-editor-textarea"
                          rows={2}
                          value={gearDraft.special?.description ?? ''}
                          onChange={(e) =>
                            setGearDraft({
                              ...gearDraft,
                              special: {
                                kind: gearDraft.special?.kind ?? 'burst',
                                name: gearDraft.special?.name ?? '',
                                description: e.target.value,
                                chance: gearDraft.special?.chance,
                                power: gearDraft.special?.power,
                              },
                            })
                          }
                        />
                      </label>
                      <div className="ink-editor-nums">
                        <label className="ink-field">
                          <span>種類</span>
                          <select
                            value={gearDraft.special?.kind ?? 'burst'}
                            onChange={(e) =>
                              setGearDraft({
                                ...gearDraft,
                                special: {
                                  kind: e.target.value as 'burst' | 'stun_proc' | 'revive',
                                  name: gearDraft.special?.name ?? '',
                                  description: gearDraft.special?.description ?? '',
                                  chance: gearDraft.special?.chance,
                                  power: gearDraft.special?.power,
                                },
                              })
                            }
                          >
                            <option value="burst">爆發（額外傷害）</option>
                            <option value="stun_proc">定身（暈眩）</option>
                            <option value="revive">護體（復活一次）</option>
                          </select>
                        </label>
                        <label className="ink-field">
                          <span>觸發機率（0–1，護體免填）</span>
                          <input
                            inputMode="decimal"
                            value={numOrEmpty(gearDraft.special?.chance)}
                            onChange={(e) =>
                              setGearDraft({
                                ...gearDraft,
                                special: {
                                  kind: gearDraft.special?.kind ?? 'burst',
                                  name: gearDraft.special?.name ?? '',
                                  description: gearDraft.special?.description ?? '',
                                  chance: parseOptionalFloat(e.target.value),
                                  power: gearDraft.special?.power,
                                },
                              })
                            }
                          />
                        </label>
                        <label className="ink-field">
                          <span>倍率／比例</span>
                          <input
                            inputMode="decimal"
                            value={numOrEmpty(gearDraft.special?.power)}
                            onChange={(e) =>
                              setGearDraft({
                                ...gearDraft,
                                special: {
                                  kind: gearDraft.special?.kind ?? 'burst',
                                  name: gearDraft.special?.name ?? '',
                                  description: gearDraft.special?.description ?? '',
                                  chance: gearDraft.special?.chance,
                                  power: parseOptionalFloat(e.target.value),
                                },
                              })
                            }
                          />
                        </label>
                      </div>
                    </fieldset>
                  )}

                  <div className="ink-cta-stack">
                    <button type="button" className="ink-btn ink-btn--primary" onClick={handleGearSave}>
                      儲存此裝備
                    </button>
                    <button type="button" className="ink-btn ink-btn--ghost" onClick={handleGearRevert}>
                      還原官方版
                    </button>
                  </div>
                </div>
              ) : (
                <p className="ink-note">找不到此裝備。</p>
              )}
            </>
          )}
        </>
      )}

      {tab === 'results' && (
        <>
          <p className="ink-note">列出各事件已改嘅「結果敘事」，按行可直接跳去該事件編修。</p>
          {patchedResults.length === 0 ? (
            <p className="ink-note">尚未有任何結果文案覆寫。</p>
          ) : (
            <ul className="ink-editor-list">
              {patchedResults.map((row) => (
                <li key={`${row.eventId}-${row.choiceId}`}>
                  <button
                    type="button"
                    className="ink-editor-row"
                    onClick={() => {
                      setTab('events');
                      setSelectedId(row.eventId);
                    }}
                  >
                    <span className="ink-editor-row-title">
                      {row.eventTitle} · {row.choiceLabel}
                    </span>
                    <span className="ink-editor-row-id">{row.narrate}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {toast ? (
        <p className="ink-editor-toast" role="status">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
