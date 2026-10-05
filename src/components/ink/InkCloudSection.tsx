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
import { flushCloudSync, restoreFromCloud, getCloudSyncStatus, subscribeCloudSyncStatus } from '../../cloud/sync';
import { writeLocal } from '../../cloud/localBridge';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = { onOpenBoard: () => void };

/** 設定頁「雲端」區：身份狀態、綁定電郵、換機登入、由雲端載入、開排行榜 */
export function InkCloudSection({ onOpenBoard }: Props) {
  const [id, setId] = useState<CloudIdentity | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const syncStatus = useSyncExternalStore(subscribeCloudSyncStatus, getCloudSyncStatus, () => 'idle');

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

  if (!cloudConfigured()) return null;

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

  const status = checking
    ? '連接雲端中……'
    : !id
      ? '未連上雲端，進度照樣存喺本機。'
      : id.email
        ? `已綁定 ${id.email}`
        : id.pendingEmail
          ? `等緊確認 ${id.pendingEmail}`
          : '匿名身份（綁定電郵先可以換機）';

  const backupStatus = {
    idle: '等待下一次進度備份。',
    pending: '進度等待上傳。',
    uploading: '正在備份進度……',
    synced: '最新進度已備份。',
    retrying: '備份未成功，正在重試；本機進度照常保存。',
  }[syncStatus];

  return (
    <section className="ink-settings-block" aria-label="雲端">
      <p className="ink-settings-label">雲端 · 排行榜</p>
      <p className="ink-cloud-status" title={cloudLastError() || undefined}>
        {status}
      </p>
      {id && <p className="ink-cloud-msg" role="status">{backupStatus}</p>}
      <button type="button" className="ink-settings-toggle is-on" onClick={onOpenBoard}>
        開江湖榜 · 江湖排名／修為境界／一生總結
      </button>
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
