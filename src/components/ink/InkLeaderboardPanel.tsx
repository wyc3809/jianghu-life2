import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CULTIVATION_TIERS } from '@core/life/cultivation';
import { BOARD_LIMIT, cloudConfigured, ensureIdentity, fetchBoard, type BoardKind, type BoardRow } from '../../cloud/cloud';

const TABS: { kind: BoardKind; label: string; hint: string }[] = [
  { kind: 'rank', label: '江湖排名', hint: '現役俠客 · 名次越前越高' },
  { kind: 'cultivation', label: '修為境界', hint: '現役俠客 · 境界高者居上，同境比修為' },
  { kind: 'life', label: '一生總結', hint: '已掩卷嘅一世 · 壽數、武學、名望、境界、稱號、成就合計' },
];

function tierName(tier: number): string {
  return CULTIVATION_TIERS[Math.max(0, Math.min(CULTIVATION_TIERS.length - 1, tier))]?.name ?? '';
}

function mainValue(kind: BoardKind, r: BoardRow): string {
  if (kind === 'rank') return `第 ${r.value.toLocaleString('zh-Hant')} 位`;
  if (kind === 'cultivation') return tierName(r.value);
  return `${r.value.toLocaleString('zh-Hant')} 分`;
}

function subValue(kind: BoardKind, r: BoardRow): string {
  if (kind === 'cultivation') return `修為 ${r.sub.toLocaleString('zh-Hant')} · ${r.age} 歲`;
  return `${tierName(r.sub)} · ${r.age} 歲`;
}

/** 開發用示範數據：?cloudDemo=1（只限 dev） */
function demoRows(kind: BoardKind): BoardRow[] {
  const names = ['葉孤城', '沈浪', '花滿樓', '陸小鳳', '蕭秋水', '燕南天', '李尋常', '白無瑕'];
  return names.map((name, i) => ({
    userId: i === 2 ? 'me' : `u${i}`,
    name,
    value:
      kind === 'rank' ? [3, 18, 64, 230, 811, 1520, 4200, 9800][i]! : kind === 'cultivation' ? 13 - i : 1480 - i * 137,
    sub: kind === 'cultivation' ? 900000 - i * 70000 : 12 - i,
    age: 40 + i * 4,
  }));
}

type Props = { onClose: () => void };

/** 排行榜：三個榜（江湖排名／修為境界／一生總結），各取前 50 */
export function InkLeaderboardPanel({ onClose }: Props) {
  const [kind, setKind] = useState<BoardKind>('rank');
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const demo = import.meta.env.DEV && new URLSearchParams(window.location.search).has('cloudDemo');

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (demo) {
      setMe('me');
      return;
    }
    void ensureIdentity().then((id) => setMe(id?.userId ?? null));
  }, [demo]);

  useEffect(() => {
    let alive = true;
    if (demo) {
      setRows(demoRows(kind));
      return;
    }
    setLoading(true);
    void fetchBoard(kind).then((r) => {
      if (!alive) return;
      setRows(r);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [kind, demo]);

  const tab = TABS.find((t) => t.kind === kind)!;

  return createPortal(
    <div
      className="ink-modal"
      role="dialog"
      aria-modal="true"
      aria-label="排行榜"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ink-modal-card ink-settings-card ink-board-card">
        <header className="ink-settings-head">
          <h3>江湖榜</h3>
          <button ref={closeRef} type="button" className="ink-icon-btn" onClick={onClose} aria-label="關閉排行榜">
            ✕
          </button>
        </header>
        <div className="ink-settings-seg" role="tablist" aria-label="榜單">
          {TABS.map((t) => (
            <button
              key={t.kind}
              type="button"
              role="tab"
              aria-selected={kind === t.kind}
              className={`ink-settings-seg-btn${kind === t.kind ? ' is-on' : ''}`}
              onClick={() => setKind(t.kind)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="ink-board-hint">{tab.hint}</p>
        {!cloudConfigured() && !demo ? (
          <p className="ink-note ink-note--center">雲端未開通，排行榜暫未能顯示。</p>
        ) : loading && !rows ? (
          <p className="ink-note ink-note--center">翻閱榜單中……</p>
        ) : !rows ? (
          <p className="ink-note ink-note--center">連唔到雲端，遲啲再試。</p>
        ) : rows.length === 0 ? (
          <p className="ink-note ink-note--center">榜上暫時無人，搶先留名。</p>
        ) : (
          <ol className="ink-board-list" aria-label={`${tab.label}前 ${BOARD_LIMIT} 名`}>
            {rows.map((r, i) => (
              <li key={`${r.userId}-${i}`} className={`ink-board-row${r.userId === me ? ' is-me' : ''}`}>
                <span className="ink-board-pos">{i + 1}</span>
                <span className="ink-board-name">
                  <span>
                    {r.name}
                    {r.userId === me && <em>（你）</em>}
                  </span>
                  <small>{subValue(kind, r)}</small>
                </span>
                <span className="ink-board-val">{mainValue(kind, r)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>,
    document.body,
  );
}
