import { useEffect, useState } from 'react';
import {
  cloudConfigured,
  cloudLastError,
  ensureIdentity,
  linkEmail,
  refreshIdentity,
  signInWithEmail,
  type CloudIdentity,
} from '../../cloud/cloud';
import { flushCloudSync, restoreFromCloud } from '../../cloud/sync';
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
      });
  }, []);

  if (!cloudConfigured()) return null;

  const run = async (fn: () => Promise<{ ok: boolean; message: string }>) => {
    if (!EMAIL_RE.test(email.trim())) {
      setMsg('電郵格式唔啱。');
      return;
    }
    setBusy(true);
    const r = await fn();
    setMsg(r.message);
    setBusy(false);
  };

  const status = checking
    ? '連接雲端中……'
    : !id
      ? '未連上雲端，進度照樣存喺本機。'
      : id.email
        ? `已綁定 ${id.email} · 存檔自動備份`
        : id.pendingEmail
          ? `等緊確認 ${id.pendingEmail} · 存檔自動備份`
          : '匿名身份 · 存檔自動備份（綁定電郵先可以換機）';

  return (
    <section className="ink-settings-block" aria-label="雲端">
      <p className="ink-settings-label">雲端 · 排行榜</p>
      <p className="ink-cloud-status" title={cloudLastError() || undefined}>
        {status}
      </p>
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
                const ok = await restoreFromCloud(writeLocal);
                setBusy(false);
                if (ok) window.location.reload();
                else setMsg('雲端暫時冇存檔。');
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
