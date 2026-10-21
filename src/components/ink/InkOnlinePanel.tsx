import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { OnlineAccountId, OnlineBattle, OnlineSnapshot } from '@interfaces/online';
import { getSkillDef } from '@data/skills/catalog';
import { ONLINE_TEST } from '@data/redesign/onlineTestParams';
import { equippedMartialArts } from '@core/life/martialLoadout';
import { confirmOnlineCommands, onlineCommand, onlineRequest, OnlineApiError } from '../../online/client';
import { publicOnline, worldJoined, forgetWorldHint } from '../../cloud/online';
import { InkIcon } from './InkIcon';
import './online.css';

const Battle = lazy(() => import('./InkAutoBattle').then(m => ({ default: m.InkAutoBattle })));
const SESSION = 'jianghu-online-session';
const labels = { river: '沈雲舟', cloud: '謝清霜' };
function readToken() { try { return publicOnline ? worldJoined() ? 'world' : null : sessionStorage.getItem(SESSION); } catch { return null; } }
function timeLeft(until: number, now: number) { return Math.max(0, Math.ceil((until - now) / 1000)); }

/** 第32項共用江湖／本機真服務入口；隔離測試角色，唔讀寫單機人生與祖蔭存檔。 */
export default function InkOnlinePanel({ standalone = false }: { standalone?: boolean }) {
  const [token, setToken] = useState(readToken);
  const [snapshot, setSnapshot] = useState<OnlineSnapshot | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const gate = useRef(false);
  const [connected, setConnected] = useState(false);
  const [replay, setReplay] = useState<OnlineBattle | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('江湖旅人');
  const [external, setExternal] = useState<string[]>([]);
  const [internal, setInternal] = useState<string | null>(null);
  const [qinggong, setQinggong] = useState<string | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const accept = useCallback((next: OnlineSnapshot) => {
    confirmOnlineCommands(next.confirmedRequests);
    setSnapshot(next); setConnected(true);
    setError(current => current.startsWith('暫時連唔到江湖') ? '' : current);
    const settled = next.battles.filter(b => b.settledAt !== null);
    if (!seen.current) seen.current = new Set(settled.map(b => b.id));
    else {
      const fresh = settled.find(b => !seen.current!.has(b.id));
      settled.forEach(b => seen.current!.add(b.id));
      if (fresh) setReplay(current => current ?? fresh);
    }
  }, []);
  const reportError = useCallback((e: unknown) => {
    if (e instanceof OnlineApiError && (e.status === 401 || (publicOnline && (e.status === 403 || e.status === 404)))) {
      sessionStorage.removeItem(SESSION); if (publicOnline) forgetWorldHint(); setToken(null); setSnapshot(null); seen.current = null;
    }
    setError(e instanceof Error ? e.message : '暫時未能處理。');
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true, polling = false;
    const refresh = async () => {
      if (polling || document.visibilityState === 'hidden') return;
      polling = true;
      try {
        const next = await onlineRequest<OnlineSnapshot>('heartbeat', token, {});
        if (active) accept(next);
      } catch (e) { if (active) { setConnected(false); reportError(e); } }
      finally { polling = false; }
    };
    const leave = () => { void onlineRequest('leave', token, {}, true).catch(() => {}); };
    const visibility = () => { if (document.visibilityState === 'hidden') leave(); else void refresh(); };
    void refresh();
    const interval = setInterval(() => void refresh(), ONLINE_TEST.heartbeatMs);
    window.addEventListener('pagehide', leave); document.addEventListener('visibilitychange', visibility);
    return () => { active = false; clearInterval(interval); window.removeEventListener('pagehide', leave); document.removeEventListener('visibilitychange', visibility); leave(); };
  }, [token, accept, reportError]);

  const run = async (fn: () => Promise<void>) => {
    if (gate.current) return;
    gate.current = true; setPending(true); setError(''); setNotice('');
    try { await fn(); } catch (e) { reportError(e); }
    finally { gate.current = false; setPending(false); }
  };
  const refresh = async () => { if (token) accept(await onlineRequest<OnlineSnapshot>('world', token)); };
  const login = (account: OnlineAccountId) => run(async () => {
    const result = await onlineRequest<{ token: string; snapshot: OnlineSnapshot }>('login', null, { account });
    sessionStorage.setItem(SESSION, result.token); seen.current = null;
    setToken(result.token); accept(result.snapshot);
  });
  const enterWorld = () => run(async () => {
    const result = await onlineRequest<{ token: string; snapshot: OnlineSnapshot }>('login', null, { name });
    seen.current = null; setToken(result.token); accept(result.snapshot);
  });
  const me = snapshot?.me, now = snapshot?.serverNow ?? 0;
  const latest = snapshot?.battles.find(b => b.settledAt !== null);
  const openLoadout = () => {
    if (!me) return;
    setExternal((me.character.equippedArts ?? []).filter((id): id is string => Boolean(id)));
    setInternal(me.character.supportArts?.internal ?? null); setQinggong(me.character.supportArts?.qinggong ?? null);
    setEditing(!editing);
  };
  const content = <section className="ink-online" aria-label="多人江湖" id="ink-online">
    <header className="online-heading">
      <div><small>同在江湖，各憑武學</small><h2>江湖風雲</h2></div>
      <span className="online-test-seal">{publicOnline ? '共用江湖' : '本機試玩'}</span>
    </header>
    <div className="online-landscape">
      <img src={`${import.meta.env.BASE_URL}ink/ai/banners/banner-mountain-road.webp`} alt="水墨山路與遠山" />
      <div><small>江湖試場</small><b>千燈鎮</b><span>隨時挑戰 · 離線亦會應戰</span></div>
    </div>
    {!token && publicOnline ? <div className="online-frame online-login">
      <h3>{worldJoined() ? '再入江湖' : '留名江湖，隨時論劍'}</h3>
      <p>全部玩家共用江湖，各自隨時上線；你可以直接挑戰離線俠客，由系統自動應戰。</p>
      <label className="online-name-label">俠名<span className="online-frame online-name-field"><input value={name} onChange={e => setName(e.target.value)} maxLength={12} autoComplete="nickname" placeholder="輸入2至12字俠名" disabled={pending} /></span></label>
      <div className="online-pair-actions"><button className="online-frame" disabled={pending || name.trim().length < 2} onClick={() => void enterWorld()}>{worldJoined() ? '重返江湖' : '踏入江湖'}</button></div>
      <p className="online-note">試場角色與銀兩獨立，唔會修改正式存檔。曾入籍會沿用原角色；身份保留喺呢個瀏覽器，清除資料前可到遊戲設定綁電郵。</p>
    </div> : !token ? <div className="online-frame online-login">
      <h3>選一位俠客入江湖</h3><p>兩個獨立測試帳戶，可分別喺兩個視窗入場。</p>
      <div className="online-accounts">{(['river', 'cloud'] as const).map(id => <button type="button" className="online-frame" key={id} disabled={pending} onClick={() => void login(id)}>
        <InkIcon name="hat" size={38} /><strong>{labels[id]}</strong><small>初始第 {id === 'river' ? 100 : 20} 名</small><span>入江湖 ›</span>
      </button>)}</div>
      <p className="online-note">試玩角色與正式存檔分開，今次進度會留喺本機試場。</p>
    </div> : !me ? <p role="status">正在接返江湖消息……</p> : <>
      <div className="online-frame online-self">
        <div><small>現世俠客 · {connected ? '在線' : '連線中斷'}</small><h3>{me.character.name}</h3>
          <p>外功 {equippedMartialArts(me.character).filter(id => getSkillDef(id)?.kind === 'external').length}／5 · 內功 {me.character.supportArts?.internal ? 1 : 0}／1 · 身法 {me.character.supportArts?.qinggong ? 1 : 0}／1</p></div>
        <div className="online-rank"><small>江湖排名</small><strong data-my-rank={me.rank}>{me.rank}<small>名</small></strong></div>
        <div className="online-self-actions"><button className="online-frame" disabled={pending || !!me.busy} onClick={openLoadout} aria-expanded={editing}>配搭武學</button>
          <button className="online-frame" disabled={pending} onClick={() => void run(async () => {
            await onlineRequest('logout', token, {}); sessionStorage.removeItem(SESSION); setToken(null); setSnapshot(null); seen.current = null; setReplay(null); setEditing(false);
          })}>離線留場</button></div>
        {me.busy ? <p role="status">雙方交手中，正在結算戰報……</p> : me.protectedUntil > now ? <p className="online-protected">戰敗保護 · 約 {timeLeft(me.protectedUntil, now)} 秒 · 主動出擊即解除</p> : null}
      </div>
      {editing && <div className="online-frame online-loadout"><h3>武學配搭</h3><p className="online-note">已學武學跨流派配搭，最多五門外功；內功、身法各一門。</p>
        <fieldset><legend>外功 {external.length}／5</legend>{me.character.skills.filter(id => getSkillDef(id)?.kind === 'external').map(id => <button type="button" className="online-frame" key={id} aria-pressed={external.includes(id)} disabled={pending} onClick={() => setExternal(cur => cur.includes(id) ? cur.filter(x => x !== id) : cur.length < 5 ? [...cur, id] : cur)}>{getSkillDef(id)?.name}</button>)}</fieldset>
        {(['internal', 'qinggong'] as const).map(kind => <label key={kind}>{kind === 'internal' ? '內功' : '身法'}<select value={(kind === 'internal' ? internal : qinggong) ?? ''} onChange={e => (kind === 'internal' ? setInternal : setQinggong)(e.target.value || null)}>
          <option value="">不裝備</option>{me.character.skills.filter(id => getSkillDef(id)?.kind === kind).map(id => <option key={id} value={id}>{getSkillDef(id)?.name}</option>)}
        </select></label>)}
        <button className="online-frame" disabled={pending || !!me.busy} onClick={() => void run(async () => { await onlineCommand('loadout', token, { external, internal, qinggong }); await refresh(); setEditing(false); setNotice('武學配搭已更新。'); })}>保存配搭</button>
      </div>}
      <section className="online-opponents" aria-label="江湖對手"><div className="online-section-title"><h3>江湖對手</h3><small>{snapshot.population ?? snapshot.peers.length} 位俠客 · 勝出可換位</small></div>
        {snapshot.peers.length <= 1 && <p className="online-note">暫未有其他俠客入籍。你可以先離線留場，下次返嚟再查看。</p>}
        {snapshot.peers.filter(p => p.id !== me.id).map(peer => <div className="online-frame online-opponent" key={peer.id} data-peer-id={peer.id} data-peer-online={peer.online}>
          <div className="online-opponent-copy"><small>{peer.online ? '在線' : '離線 · 自動應戰'}</small><h3>{peer.name}</h3>
            <p>江湖第 <b data-peer-rank={peer.rank}>{peer.rank}</b> 名{peer.protectedUntil > now ? ` · 保護 ${timeLeft(peer.protectedUntil, now)} 秒` : peer.busy ? ' · 交戰中' : ''}</p></div>
          <button type="button" className="online-frame online-challenge" disabled={pending || !!me.busy || !!peer.busy || peer.protectedUntil > now || !connected} onClick={() => void run(async () => { await onlineCommand('challenge', token, { target: peer.id }); await refresh(); setNotice('挑戰已送達，正在交手。'); })}>{peer.protectedUntil > now ? '保護中' : peer.busy || me.busy ? '交戰中' : '挑戰'}</button>
        </div>)}
      </section>
      <section className="online-frame online-income" aria-label="修行收益"><div><h3>修行所得</h3><p>在線待領 <b data-online-pending>{me.pendingOnline}</b> · 離線待領 <b data-offline-pending>{me.pendingOffline}</b></p><small>試場銀兩 <b data-silver>{me.silver}</b></small></div>
        <button className="online-frame" disabled={pending || me.pendingOnline + me.pendingOffline === 0 || !connected} onClick={() => void run(async () => {
          const result = await onlineCommand<{ total: number }>('claim', token, {}); await refresh(); setNotice(`已領取 ${result.total} 試場銀兩。`);
        })}>收取收益</button>
      </section>
      {latest && <section className="online-frame online-result" aria-label="最近戰果" data-battle-id={latest.id}><small>最近戰果 · 已結算</small>
        <h3>{latest.winner === null ? '平手，名次不變' : latest.winner === me.id ? '此戰得勝' : '此戰落敗'}</h3>
        <p>第 {latest.before[me.id]} 名 → 第 {latest.after?.[me.id]} 名</p><p className="online-note">切磋只影響名次，人物不受傷、唔會死亡。</p>
        <button className="online-frame" onClick={() => setReplay(latest)}>重播交手</button>
      </section>}
      <details className="online-frame online-history"><summary>江湖戰報 · 最近 {snapshot.battles.filter(b => b.settledAt !== null).length} 場</summary>
        {snapshot.battles.filter(b => b.settledAt !== null).map(b => <button className="online-frame" key={b.id} onClick={() => setReplay(b)}>{b.characters[b.attacker]?.name ?? '江湖俠客'} 對 {b.characters[b.defender]?.name ?? '江湖俠客'}<small>{b.winner ? `${b.characters[b.winner]?.name ?? '俠客'} 勝` : '平手'} · 查看戰報 ›</small></button>)}
      </details>
    </>}
    <div className="online-feedback" aria-live="polite">{error ? <p role="alert">{error}</p> : notice && <p>{notice}</p>}</div>
    <details className="online-frame online-rules"><summary>試玩規則與測試值</summary><p>在線每分鐘 {ONLINE_TEST.onlineSilverPerMinute}、離線每分鐘 {ONLINE_TEST.offlineSilverPerMinute} 試場銀兩；離線最多累積48小時。戰敗保護 {ONLINE_TEST.protectionMs / 1000} 秒，主動出擊解除。</p><p>以上係方便驗收嘅測試值，未定為正式數值。斷線最多約8秒轉為離線，角色仍會自動應戰；試玩唔會改正式存檔。</p></details>
    {replay && me && <Suspense fallback={<p role="status">載入交手演出……</p>}><Battle key={replay.id} replay={replay.replays[me.id]} character={replay.characters[me.id]} rewardCoins={0} unified reduceMotion={reduced}
      notice={<span className="online-battle-note">切磋不傷身 · 勝負只論名次</span>} onDone={() => setReplay(null)} /></Suspense>}
  </section>;
  return standalone ? <main className="scroll-shell scroll-shell--play online-page"><a className="online-back" href={import.meta.env.BASE_URL}>‹ 返回遊戲</a>{content}</main> : content;
}
