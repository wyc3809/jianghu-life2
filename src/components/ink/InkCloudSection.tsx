import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  cloudConfigured,
  cloudLastError,
  ensureIdentity,
  linkEmail,
  refreshIdentity,
  signInWithEmail,
  type CloudIdentity,
} from '../../cloud/cloud';
import {
  flushCloudSync,
  restoreFromCloud,
  getCloudSyncStatus,
  getCloudLastSyncedAt,
  subscribeCloudSyncStatus,
} from '../../cloud/sync';
import { writeLocal } from '../../cloud/localBridge';
import { getLastLocalSaveAt, subscribeLifeSaveStatus } from '@core/life/saveIndexedDb';
import { formatSaveTime } from '../../ui/formatSaveTime';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = { onOpenBoard: () => void };

/**
 * 設定頁「帳戶 · 存檔」區：永遠顯示綁定狀態、最近存檔時間、同步結果
 * （design/agreed-design-2026-10.md §6）；雲端有開通先出綁定電郵、換機登入、由雲端載入、排行榜。
 */
export function InkCloudSection({ onOpenBoard }: Props) {
  const [id, setId] = useState<CloudIdentity | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const syncStatus = useSyncExternalStore(subscribeCloudSyncStatus, getCloudSyncStatus, () => 'idle');
  const lastSyncedAt = useSyncExternalStore(subscribeCloudSyncStatus, getCloudLastSyncedAt, () => 0);
  const lastSavedAt = useSyncExternalStore(subscribeLifeSaveStatus, getLastLocalSaveAt, () => 0);
  const configured = cloudConfigured();

  useEffect(() => {
    if (!cloudConfigured()) {
      setChecking(false);
      return;
    }
    void ensureIdentity()
      .then((first) => (first ? refreshIdentity() : null))
      .then((i) => {
        setId(i);
        setChecking(false);
      }).catch(() => { setId(null); setChecking(false); });
  }, []);

  const run = async (fn: () => Promise<{ ok: boolean; message: string }>) => {
    if (!EMAIL_RE.test(email.trim())) {
      setMsg('電郵格式唔啱。');
      return;
    }
    setBusy(true);
    try {
      const r = await fn();
      setMsg(r.message);
    } catch {
      setMsg('雲端連接失敗，請稍後再試。');
    } finally { setBusy(false); }
  };

  const bindStatus = !configured
    ? '未綁定 · 雲端服務未開通，進度只存喺本機'
    : checking
      ? '連接雲端中……'
      : !id
        ? '未綁定 · 未連上雲端，進度照樣存喺本機'
        : id.email
          ? `已綁定 ${id.email}`
          : id.pendingEmail
            ? `等緊確認 ${id.pendingEmail}`
            : '未綁定 · 匿名身份（綁定電郵先可以換機）';

  const syncText = !configured
    ? '未同步 · 雲端服務未開通'
    : !id
      ? '未同步 · 未連上雲端'
      : {
          idle: lastSyncedAt ? `已同步 · ${formatSaveTime(lastSyncedAt)}` : '等待下一次同步',
          pending: '有新進度等待上傳',
          uploading: '同步中……',
          synced: `已同步 · ${formatSaveTime(lastSyncedAt)}`,
          retrying: '同步失敗，正在重試；本機進度照常保存',
        }[syncStatus];

  return (
    <section className="ink-settings-block" aria-label="帳戶與存檔">
      <p className="ink-settings-label">帳戶 · 存檔</p>
      <dl className="ink-account-rows">
        <div className="ink-account-row">
          <dt>綁定狀態</dt>
          <dd title={cloudLastError() || undefined}>{bindStatus}</dd>
        </div>
        <div className="ink-account-row">
          <dt>最近存檔</dt>
          <dd>{formatSaveTime(lastSavedAt)}</dd>
        </div>
        <div className="ink-account-row" role="status">
          <dt>同步結果</dt>
          <dd className={syncStatus === 'retrying' && configured && id ? 'is-warn' : undefined}>{syncText}</dd>
        </div>
      </dl>
      {configured && (
        <button type="button" className="ink-settings-toggle is-on" onClick={onOpenBoard}>
          開江湖榜 · 江湖排名／修為境界／一生總結
        </button>
      )}
      {id && (
        <>
          <input
            className="ink-cloud-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="電郵（綁定或換機登入）"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="ink-cloud-actions">
            {!id.email && (
              <button
                type="button"
                className="ink-settings-seg-btn"
                disabled={busy}
                onClick={() => {
                  flushCloudSync();
                  void run(() => linkEmail(email.trim()));
                }}
              >
                綁定呢個身份
              </button>
            )}
            <button
              type="button"
              className="ink-settings-seg-btn"
              disabled={busy}
              onClick={() => void run(() => signInWithEmail(email.trim()))}
            >
              換機登入
            </button>
            <button
              type="button"
              className="ink-settings-seg-btn"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm('用雲端存檔覆蓋本機進度？本機未上傳嘅進度會冇咗。')) return;
                setBusy(true);
                try {
                  const ok = await restoreFromCloud(writeLocal);
                  if (ok) window.location.reload();
                  else setMsg('未能取得雲端存檔，請檢查連線再試。');
                } catch {
                  setMsg('雲端進度未能儲存到本機，請稍後再試。');
                } finally { setBusy(false); }
              }}
            >
              由雲端載入
            </button>
          </div>
        </>
      )}
      {msg && <p className="ink-cloud-msg">{msg}</p>}
    </section>
  );
}
