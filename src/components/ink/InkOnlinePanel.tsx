import { onlineJadeProgress } from '@core/online/rules';
import { useLifeStore } from '../../store/lifeStore';
import { useAncestryStore } from '../../store/ancestryStore';
import { characterForPreset } from '@core/life/loadoutPresets';
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { OnlineAccountId, OnlineBattle, OnlineSnapshot } from '@interfaces/online';
import { getSkillDef } from '@data/skills/catalog';
import { ONLINE_TEST } from '@data/redesign/onlineTestParams';
import { equippedMartialArts } from '@core/life/martialLoadout';
import { confirmOnlineCommands, onlineCommand, onlineRequest, OnlineApiError } from '../../online/client';
import { publicOnline, worldJoined, forgetWorldHint } from '../../cloud/online';
import { InkIcon } from './InkIcon';
import { InkFeatureMenu, type InkFeatureEntry } from './InkFeatureMenu';
import './online.css';

const Battle = lazy(() => import('./InkAutoBattle').then(m => ({ default: m.InkAutoBattle })));
const SESSION = 'jianghu-online-session';
const labels = { river: '沈雲舟', cloud: '謝清霜' };
function readToken() { try { return publicOnline ? worldJoined() ? 'world' : null : sessionStorage.getItem(SESSION); } catch { return null; } }
type OnlineView = 'main' | 'opponents' | 'loadout' | 'income' | 'history' | 'rules';
const titles: Record<OnlineView, string> = { main: '江湖風雲', opponents: '對手名冊', loadout: '武學配搭', income: '修行所得', history: '江湖戰報', rules: '試場規則' };
function timeLeft(until: number, now: number) { return Math.max(0, Math.ceil((until - now) / 1000)); }

/** 第32項共用江湖／本機真服務入口；正式模式使用人物雲存檔及帳戶獎勵，本機測試仍然隔離。 */
export default function InkOnlinePanel({ standalone = false, onBack, onPrepare }: { standalone?: boolean; onBack?: () => void; onPrepare?:()=>void }) {
  const [token, setToken] = useState(readToken);
  const [snapshot, setSnapshot] = useState<OnlineSnapshot | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const gate = useRef(false);
  const [connected, setConnected] = useState(false);
  const [replay, setReplay] = useState<OnlineBattle | null>(null);
  const [view, setView] = useState<OnlineView>('main');
  const panelRef = useRef<HTMLElement>(null);
  const [name] = useState(()=>useLifeStore.getState().state?.character.name ?? '江湖旅人');
  const [external, setExternal] = useState<string[]>([]);
  const [internal, setInternal] = useState<string | null>(null);
  const [qinggong, setQinggong] = useState<string | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const accept = useCallback((next: OnlineSnapshot) => {
    confirmOnlineCommands(next.confirmedRequests);
    setSnapshot(next); setConnected(true);
    if(publicOnline&&!standalone)useAncestryStore.getState().receiveOnlineJade(`public:${next.me.id}`,next.me.jadeEarnedTotal??0);
    setError(current => current.startsWith('暫時無法連接江湖') ? '' : current);
    const settled = next.battles.filter(b => b.settledAt !== null);
    if (!seen.current) seen.current = new Set(settled.map(b => b.id));
    else {
      const fresh = settled.find(b => !seen.current!.has(b.id));
      settled.forEach(b => seen.current!.add(b.id));
      if (fresh) setReplay(current => current ?? fresh);
    }
  }, [standalone]);
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
    const result = await onlineRequest<{ token: string; snapshot: OnlineSnapshot }>('login', null, { name:name.trim().slice(0,12) || '江湖旅人' });
    seen.current = null; setToken(result.token); accept(result.snapshot);
  });
  const me = snapshot?.me, now = snapshot?.serverNow ?? 0;
  const jadeWins=me?onlineJadeProgress(me,now):{attackWins:0,defendWins:0};
  const duelArts=me?equippedMartialArts(characterForPreset(me.character,'duel')):[];
  const latest = snapshot?.battles.find(b => b.settledAt !== null);
  const openLoadout = () => {
    if (!me) return;
    if(onPrepare){onPrepare();return;}
    const viewCharacter=characterForPreset(me.character,'duel');
    setExternal((viewCharacter.equippedArts ?? []).filter((id): id is string => Boolean(id)));
    setInternal(viewCharacter.supportArts?.internal ?? null); setQinggong(viewCharacter.supportArts?.qinggong ?? null);
    setView('loadout');
  };
  useLayoutEffect(() => {
    panelRef.current?.closest('.ink-play-body, .scroll-shell')?.scrollTo({ top: 0 });
  }, [view]);
  const entries: InkFeatureEntry<OnlineView>[] = [
    { id: 'opponents', title: '隨機對戰', icon: 'banner', hint: '全江湖隨機配對 · 同段位優先', badge: snapshot ? `${Math.max(0, snapshot.peers.length - 1)}人` : undefined },
    { id: 'loadout', title: '對戰配搭', icon: 'scroll', hint: '前往人物頁 · 預先保存對戰配搭' },
    { id: 'income', title: '修行所得', icon: 'silver', hint: '查看在線與離線收成', badge: me && me.pendingOnline + me.pendingOffline > 0 ? '可領' : undefined },
    { id: 'history', title: '江湖戰報', icon: 'swords', hint: '細看戰果 · 重溫逐招交手', badge: snapshot ? `${snapshot.battles.filter(b => b.settledAt !== null).length}場` : undefined },
    { id: 'rules', title: '試場規則', icon: 'fan', hint: '排名換位 · 戰敗保護與收益' },
  ];
  const openView = (next: OnlineView) => { setError(''); setNotice(''); if (next === 'loadout') openLoadout(); else setView(next); };
  const content = <section className="ink-panel ink-online" aria-label="多人江湖" id="ink-online" ref={panelRef}>
    {(view !== 'main' || onBack) && <button type="button" className="ink-jianghu-back" onClick={() => view === 'main' ? onBack?.() : setView('main')}>
      ‹ {view === 'main' ? '返回江湖' : '返回江湖風雲'}
    </button>}
    <header className="online-heading"><h2>{titles[view]}</h2><span className="online-test-seal">{publicOnline ? '共用封測' : '本機試玩'}</span></header>
    <div className="online-feedback" aria-live="polite">{error ? <p role="alert">{error}</p> : notice && <p>{notice}</p>}</div>
    {view === 'rules' ? <div className="online-rules">
      <p className="online-lead">各自隨時入江湖，離線亦會自動應戰。</p>
      <h3>排名與勝負</h3><p>排名較低者戰勝排名較高者，雙方交換名次；挑戰失敗則名次不變。切磋不會造成受傷或死亡。</p>
      <h3>免費玉石</h3><p>主動每日首3勝各120，防守每日首3勝各60，名額分開。同一對手每日只計獎一次；日常於香港時間凌晨四時更新。兩種勝場合共最多540玉石。</p><h3>戰敗保護</h3><p>戰敗後保護 {ONLINE_TEST.protectionMs / 1000} 秒，主動挑戰會解除自身保護。</p>
      <h3>修行所得</h3><p>在線每分鐘 {ONLINE_TEST.onlineSilverPerMinute}、離線每分鐘 {ONLINE_TEST.offlineSilverPerMinute} 試場銀兩。離線最多累積48小時，返回試場後可領取。</p>
      <p className="online-note">以上為封測數值，日後可能調整。離開試場頁面或斷線後，系統會在約8秒內判定離線。試場角色與銀兩獨立保存。</p>
    </div> : !token && publicOnline ? <div className="online-login">
      <p className="online-lead">留名江湖，隨時論劍。</p><p>系統隨機派發對手，同段位優先；對方離線時亦會自動應戰。</p>
      <label className="online-name-label">俠名<span className="online-frame online-name-field"><input value={name} readOnly maxLength={12} autoComplete="nickname" placeholder="輸入2至12字俠名" disabled={pending} /></span></label>
      <button className="online-frame online-enter" disabled={pending || !name.trim()} onClick={() => void enterWorld()}>{worldJoined() ? '重返江湖' : '踏入江湖'}</button>
      <p className="online-note">使用目前人物及已保存的對戰配搭，江湖名次跟隨帳戶保留。可前往設定綁定電郵；免費玉石獎勵加入同一帳戶。</p>
      <button type="button" className="online-text-link" onClick={() => setView('rules')}>查看試場規則 ›</button>
    </div> : !token ? <div className="online-login">
      <p className="online-lead">選一位俠客入江湖</p><p>兩個獨立本機測試帳戶，與正式存檔分開。</p>
      <div className="online-accounts">{(['river', 'cloud'] as const).map(id => <button type="button" className="online-frame" key={id} disabled={pending} onClick={() => void login(id)}>
        <InkIcon name="hat" size={56} label={labels[id]} /><strong>{labels[id]}</strong><small>初始第 {id === 'river' ? 100 : 20} 名</small>
      </button>)}</div>
    </div> : !me ? <p role="status">正在載入江湖資料……</p> : <>
      {view === 'main' && <>
        <div className="online-self"><div><small>現世俠客 · {connected ? '在線' : '連線中斷'}</small><h3>{me.character.name}</h3>
          <p>外功 {duelArts.filter(id => getSkillDef(id)?.kind === 'external').length}／5 · 內功 {duelArts.some(id=>getSkillDef(id)?.kind==='internal') ? 1 : 0}／1 · 身法 {duelArts.some(id=>getSkillDef(id)?.kind==='qinggong') ? 1 : 0}／1</p></div>
          <div className="online-rank"><small>江湖排名</small><strong data-my-rank={me.rank}>{me.rank}<small>名</small></strong></div>
          {me.busy ? <p role="status">雙方交手中，正在結算戰報……</p> : me.protectedUntil > now && <p className="online-protected">戰敗保護 · 約 {timeLeft(me.protectedUntil, now)} 秒</p>}
        </div>
        <InkFeatureMenu label="江湖風雲功能" entries={entries} onOpen={openView} />
        <button className="online-text-link online-leave" disabled={pending} onClick={() => void run(async () => {
          await onlineRequest('logout', token, {}); sessionStorage.removeItem(SESSION); setToken(null); setSnapshot(null); seen.current = null; setReplay(null); setView('main');
        })}>離線留場 ›</button>
      </>}
      {view === 'loadout' && <div className="online-loadout"><p className="online-lead">武學可跨流派搭配。</p><p className="online-note">只顯示已學武學；交戰期間不能更換。</p>
        <fieldset><legend>外功 {external.length}／5</legend>{me.character.skills.filter(id => getSkillDef(id)?.kind === 'external').map(id => <button type="button" className="online-frame" key={id} aria-pressed={external.includes(id)} disabled={pending || !!me.busy} onClick={() => setExternal(cur => cur.includes(id) ? cur.filter(x => x !== id) : cur.length < 5 ? [...cur, id] : cur)}>{getSkillDef(id)?.name}</button>)}</fieldset>
        {(['internal', 'qinggong'] as const).map(kind => <label key={kind}>{kind === 'internal' ? '內功' : '身法'}<select disabled={pending || !!me.busy} value={(kind === 'internal' ? internal : qinggong) ?? ''} onChange={e => (kind === 'internal' ? setInternal : setQinggong)(e.target.value || null)}>
          <option value="">不裝備</option>{me.character.skills.filter(id => getSkillDef(id)?.kind === kind).map(id => <option key={id} value={id}>{getSkillDef(id)?.name}</option>)}
        </select></label>)}
        <button className="online-frame" disabled={pending || !!me.busy} onClick={() => void run(async () => { await onlineCommand('loadout', token, { external, internal, qinggong }); await refresh(); setView('main'); setNotice('武學配搭已更新。'); })}>保存配搭</button>
      </div>}
      {view === 'opponents' && <section className="online-opponents" aria-label="江湖對手"><div className="online-section-title"><p>我居第 <strong data-my-rank={me.rank}>{me.rank}</strong> 名</p><small>{snapshot.population ?? snapshot.peers.length} 位俠客</small></div>
        <p className="online-note">排名較低者獲勝可交換名次；離線俠客仍會應戰。</p>
        {snapshot.peers.length <= 1 && <p className="online-empty">尚無其他俠客入籍。可先離線，稍後返回查看；角色仍會留在試場。</p>}
        <div className="online-frame online-result"><h3>系統隨機配對</h3><p>同段位優先，全江湖均可能遇到；配對後直接開戰。</p><p>主動獎勵勝場 {jadeWins.attackWins}／3 · 防守 {jadeWins.defendWins}／3</p><p>累計免費玉石 {(me.jadeEarnedTotal??0).toLocaleString('zh-Hant')}</p><button type="button" className="online-frame online-enter" disabled={pending||!!me.busy||!connected||snapshot.peers.length<=1} onClick={()=>void run(async()=>{await onlineCommand('challenge',token,{});await refresh();setNotice('已配對，正在結算交手。');})}>隨機挑戰</button></div>
        {snapshot.peers.filter(p => p.id !== me.id).map(peer => <div className="online-frame online-opponent" key={peer.id} data-peer-id={peer.id} data-peer-online={peer.online}>
          <div className="online-opponent-copy"><small>{peer.online ? '在線' : '離線 · 自動應戰'}</small><h3>{peer.name}</h3>
            <p>江湖第 <b data-peer-rank={peer.rank}>{peer.rank}</b> 名{peer.protectedUntil > now ? ` · 保護 ${timeLeft(peer.protectedUntil, now)} 秒` : peer.busy ? ' · 交戰中' : ''}</p></div>
          <span className="online-note">隨機候選 · {peer.protectedUntil>now?'保護中':peer.busy?'交戰中':'可配對'}</span>
        </div>)}
      </section>}
      {view === 'income' && <section className="online-income" aria-label="修行收益"><p className="online-lead">修行不輟，收成有時。</p>
        <div className="online-balance"><InkIcon name="silver" size={28} /><span>試場銀兩</span><strong data-silver>{me.silver.toLocaleString('zh-HK')}</strong></div>
        <div className="online-income-grid"><div className="online-frame"><small>在線待領</small><strong data-online-pending>{me.pendingOnline.toLocaleString('zh-HK')}</strong></div><div className="online-frame"><small>離線待領</small><strong data-offline-pending>{me.pendingOffline.toLocaleString('zh-HK')}</strong></div></div>
        <p className="online-note">在線每分鐘 {ONLINE_TEST.onlineSilverPerMinute}、離線每分鐘 {ONLINE_TEST.offlineSilverPerMinute} 試場銀兩，離線最多累積48小時。</p>
        <button className="online-frame online-enter" disabled={pending || me.pendingOnline + me.pendingOffline === 0 || !connected} onClick={() => void run(async () => {
          const result = await onlineCommand<{ total: number }>('claim', token, {}); await refresh(); setNotice(`已領取 ${result.total} 試場銀兩。`);
        })}>收取收益</button>
      </section>}
      {view === 'history' && <div className="online-history">
        {latest ? <section className="online-frame online-result" aria-label="最近戰果" data-battle-id={latest.id}><small>最近戰果 · 已結算</small>
          <h3>{latest.winner === null ? '平手，名次不變' : latest.winner === me.id ? '此戰得勝' : '此戰落敗'}</h3>
          <p>第 {latest.before[me.id]} 名 → 第 {latest.after?.[me.id]} 名</p><p>本場免費玉石＋{latest.jadeAwards?.[me.id]??0}</p><p className="online-note">切磋僅影響名次，不會造成受傷或死亡。</p>
          <button className="online-frame" onClick={() => setReplay(latest)}>重播交手</button>
        </section> : <p className="online-empty">尚無交手紀錄。挑戰其他俠客後，可在此查看戰報。</p>}
        {snapshot.battles.filter(b => b.settledAt !== null).map(b => <button className="online-frame online-report-row" key={b.id} onClick={() => setReplay(b)}>
          <strong>{b.characters[b.attacker]?.name ?? '江湖俠客'} <span>對</span> {b.characters[b.defender]?.name ?? '江湖俠客'}</strong><small>{b.winner ? `${b.characters[b.winner]?.name ?? '俠客'} 勝` : '平手'} · 查看戰報 ›</small>
        </button>)}
      </div>}
    </>}
    {replay && me && <Suspense fallback={<p role="status">載入交手演出……</p>}><Battle key={replay.id} replay={replay.replays[me.id]} character={replay.characters[me.id]} rewardCoins={0} unified reduceMotion={reduced}
      notice={<span className="online-battle-note">切磋不傷身 · 勝負只論名次</span>} onDone={() => setReplay(null)} /></Suspense>}
  </section>;
  return standalone ? <main className="scroll-shell scroll-shell--play online-page"><a className="online-back" href={import.meta.env.BASE_URL}>‹ 返回遊戲</a>{content}</main> : content;
}
