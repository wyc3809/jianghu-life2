import { useEffect, useMemo, useRef, useState } from 'react';
import { createVisualLoop, watchVisualActivity } from '../ui/visualActivity';
import { simulateSectBattle } from '@core/online/sectBattle';
import { sectBattleFixture } from './sectBattle/fixtures';
import { loadSectPreviewImages, type SectPreviewImages } from './sectBattle/assets';
import { SectBattleRenderer } from './sectBattle/renderer';
import type { SectBattleFigure } from '@interfaces/sectBattle';
import { InkAppearancePicker } from '../components/ink/InkAppearance';
import { readAppearance } from '@interfaces/appearance';
import './sectBattle/sect-battle.css';

type Status = 'ready' | 'playing' | 'paused' | 'result';
interface PlayerView { seconds: number; status: Status; selected: string; speed: number }
interface Controls {
  toggle(): void; result(): void; restart(): void; speed(): void; select(id: string): void; reduced(value: boolean): void;
}
const TEAM_NAMES = ['青雲劍派', '武當派'];

/** 第57項隔離同場原型：二十名人物共用時間軸，演出不接存檔、帳戶或獎勵。 */
export default function SectBattlePreview() {
  const [roster, setRoster] = useState(sectBattleFixture);
  const replay = useMemo(() => simulateSectBattle(roster, 5707), [roster]);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null), controls = useRef<Controls | null>(null);
  const [pack, setPack] = useState<SectPreviewImages | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const reduceRef = useRef(reduced); reduceRef.current = reduced;
  const [rosterOpen, setRosterOpen] = useState(false);
  const [view, setView] = useState<PlayerView>({ seconds: 0, status: 'ready', selected: 'sect-demo-1', speed: 1 });
  const selection = useRef(view.selected); selection.current = view.selected;
  const frame = replay.frames[Math.min(replay.frames.length - 1, Math.floor(view.seconds / .05))];
  const selected = frame.figures.find(u => u.id === view.selected)!;
  const latest = replay.events.filter(e => e.at <= view.seconds && e.actor === selected.id).at(-1);
  const counts = [0, 1].map(side => frame.figures.filter(u => u.side === side && u.hp > 0).length);
  const winner = replay.winner === null ? '本場未分勝負' : `${TEAM_NAMES[replay.winner]}勝出`;

  useEffect(() => {
    let gone = false; setError('');
    void loadSectPreviewImages().then(images => { if (!gone) setPack(images); }).catch(reason => { if (!gone) setError(String(reason.message)); });
    return () => { gone = true; };
  }, [retry]);
  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(motion.matches); motion.addEventListener('change', change);
    return () => motion.removeEventListener('change', change);
  }, []);
  useEffect(() => { controls.current?.reduced(reduced); }, [reduced]);
  useEffect(() => {
    if (!pack || !canvas.current) return;
    const renderer = new SectBattleRenderer(canvas.current, pack);
    let seconds = 0, status: Status = 'ready', selected = selection.current, speed = 1, active = true, lastPublish = -1;
    const publish = () => { lastPublish = seconds; setView({ seconds, status, selected, speed }); };
    const draw = () => renderer.draw(replay, seconds, selected, reduceRef.current);
    const loop = createVisualLoop((_now, dt) => {
      seconds = Math.min(replay.duration, seconds + dt * speed);
      if (seconds >= replay.duration) { status = 'result'; loop.setActive(false); publish(); }
      else if (seconds - lastPublish >= .2) publish();
      draw();
    });
    const refresh = () => loop.setActive(active && status === 'playing' && !reduceRef.current);
    controls.current = {
      toggle() {
        if (status === 'result') return;
        if (reduceRef.current) { seconds = replay.duration; status = 'result'; }
        else status = status === 'playing' ? 'paused' : 'playing';
        refresh(); publish(); draw();
      },
      result() { seconds = replay.duration; status = 'result'; refresh(); publish(); draw(); },
      restart() { seconds = 0; status = 'ready'; refresh(); publish(); draw(); },
      speed() { speed = speed === 1 ? 2 : 1; publish(); },
      select(id) { selected = id; publish(); draw(); },
      reduced(value) { if (value && status === 'playing') status = 'paused'; refresh(); publish(); draw(); },
    };
    const resize = new ResizeObserver(() => { renderer.resize(); draw(); }); resize.observe(canvas.current);
    renderer.resize(); draw(); publish();
    const unwatch = watchVisualActivity(value => { active = value; refresh(); }, { element: canvas.current, dialogs: true });
    let down: { x: number; y: number } | null = null;
    const onDown = (event: PointerEvent) => { if (event.isPrimary && event.button === 0) down = { x: event.clientX, y: event.clientY }; };
    const onUp = (event: PointerEvent) => {
      if (!down || !event.isPrimary) return;
      const start = down; down = null;
      if (Math.hypot(start.x - event.clientX, start.y - event.clientY) > 8) return;
      const rect = canvas.current!.getBoundingClientRect(), x = event.clientX - rect.x, y = event.clientY - rect.y;
      const hit = [...renderer.hitboxes].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y)).find(p => Math.hypot(p.x - x, p.y - y) <= p.radius);
      if (hit) controls.current?.select(hit.id);
    };
    const cancel = () => { down = null; };
    const target = canvas.current;
    target.addEventListener('pointerdown', onDown); target.addEventListener('pointerup', onUp); target.addEventListener('pointercancel', cancel);
    return () => {
      loop.dispose(); unwatch(); resize.disconnect(); controls.current = null;
      target.removeEventListener('pointerdown', onDown); target.removeEventListener('pointerup', onUp); target.removeEventListener('pointercancel', cancel);
    };
  }, [pack, replay]);

  return <main className="sect-battle-preview" data-status={view.status} data-seconds={view.seconds.toFixed(2)}>
    <header className="sect-battle-heading"><button type="button" onClick={() => controls.current?.restart()} aria-label="返回列陣">‹ 返回</button><h1>門派會武</h1><span>試演</span></header>
    <div className="sect-battle-teams" aria-label="雙方門派與在場人數">{TEAM_NAMES.map((name, side) => <section key={name} data-side={side}>
      <h2>{name}</h2><p><b>{counts[side]}</b>／10 人在場</p>
    </section>)}<span className="sect-battle-versus" aria-hidden="true">對陣</span></div>
    <div className="sect-battle-stage">
      <div className="sect-battle-clock"><span>{view.status === 'ready' ? '雙方列陣' : view.status === 'result' ? '會武結束' : view.status === 'paused' ? '已暫停' : '交鋒中'}</span><b>{Math.floor(view.seconds / 60)}:{String(Math.floor(view.seconds % 60)).padStart(2, '0')}</b></div>
      <canvas ref={canvas} aria-label={`同場二十人門派會武，${TEAM_NAMES[0]}在場${counts[0]}人，${TEAM_NAMES[1]}在場${counts[1]}人；可按代表名冊選取人物。`} />
      {!pack && <div className="sect-battle-loading" role="status">{error || '正在準備人物'}{error && <button type="button" onClick={() => setRetry(n => n + 1)}>重試</button>}</div>}
      {view.status === 'ready' && pack && <div className="sect-battle-ready"><span>十人對十人 · 自動交鋒</span><button type="button" className="sect-battle-primary" onClick={() => controls.current?.toggle()}>{reduced ? '查看戰果' : '開始會武'}</button></div>}
      {view.status === 'result' && <div className="sect-battle-result" role="status"><h2>{winner}</h2><p>在場 {replay.remaining[0]}：{replay.remaining[1]}</p><button type="button" onClick={() => controls.current?.restart()}>重播戰報</button></div>}
    </div>
    <section className="sect-battle-focus" aria-label="選中代表詳情">
      <div><span>{TEAM_NAMES[selected.side]} · {selected.rank === 1 ? '掌門' : `第${selected.rank}席`}</span><h3>{selected.name}<small>{selected.hp <= 0 ? '退場' : latest?.name ?? '待命'}</small></h3></div>
      <dl><div><dt>氣血</dt><dd>{Math.round(selected.hp)}／{selected.maxHp}</dd></div><div><dt>內力</dt><dd>{Math.round(selected.qi)}／{selected.maxQi}</dd></div></dl>
    </section>
    <footer className="sect-battle-controls">
      <div><button type="button" disabled={!pack || view.status === 'ready' || view.status === 'result' || reduced} onClick={() => controls.current?.toggle()}>{view.status === 'paused' ? '繼續' : '暫停'}</button>
        <button type="button" disabled={!pack || reduced} onClick={() => controls.current?.speed()}>速度 ×{view.speed}</button>
        <button type="button" onClick={() => setRosterOpen(true)}>代表名冊</button>
        <button type="button" disabled={view.status !== 'ready'} onClick={() => setAppearanceOpen(true)}>換造型</button>
        <button type="button" disabled={!pack || view.status === 'result'} onClick={() => controls.current?.result()}>直接結果</button></div>
      <div className="sect-battle-notes"><label><input type="checkbox" checked={reduced} onChange={event => setReduced(event.target.checked)}/>減少動態</label><span>{pack?.simplified ? '部分動作使用簡化演出' : '示範陣容，不派發獎勵'}</span></div>
    </footer>
    {appearanceOpen && <InkAppearancePicker appearance={readAppearance(selected.appearance)} onClose={() => setAppearanceOpen(false)} onConfirm={appearance => {
      if (view.status !== 'ready') return false;
      setRoster(current => current.map(unit => unit.id === selected.id ? { ...unit, state: { ...unit.state, character: { ...unit.state.character, appearance } } } : unit));
      return true;
    }} />}
    {rosterOpen && <SectRoster figures={frame.figures} selected={selected.id} onSelect={id => { controls.current?.select(id); setRosterOpen(false); }} onClose={() => setRosterOpen(false)} />}
  </main>;
}

function SectRoster({ figures, selected, onSelect, onClose }: { figures: SectBattleFigure[]; selected: string; onSelect(id: string): void; onClose(): void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null, dialog = ref.current!; dialog.showModal();
    return () => { dialog.close(); previous?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="sect-roster-sheet ink-person-sheet" aria-label="代表名冊" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><h2>代表名冊</h2><button type="button" onClick={onClose} aria-label="關閉代表名冊">收起</button></header>
    <div className="sect-roster-scroll">{TEAM_NAMES.map((name, side) => <section key={name}><h3>{name}</h3>{figures.filter(u => u.side === side).map(u => <button type="button" key={u.id} aria-pressed={selected === u.id} onClick={() => onSelect(u.id)}>
      <span>{u.rank === 1 ? '掌門' : `第${u.rank}席`} · {u.name}</span><small>{u.hp <= 0 ? '已退場' : `氣血 ${Math.round(u.hp)}`}</small>
    </button>)}</section>)}</div>
    <p>點選代表，可在戰場查看該人物。</p>
  </dialog>;
}
