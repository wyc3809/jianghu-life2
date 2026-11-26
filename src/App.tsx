import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useLifeStore, resetLifeSave } from './store/lifeStore';
import { InkPlayScreen } from './components/ink/InkPlayScreen';
import { InkStartGate, InkStartScreen } from './components/ink/InkStartScreen';
import { InkCreateScreen } from './components/ink/InkCreateScreen';
import { InkTapFx } from './components/ink/InkTapFx';
import { loadEventOverrides } from '@core/life/eventOverrides';

/** 事件編輯器只限開發版（正式版唔打包，#editor 亦唔生效） */
const InkEventEditor = import.meta.env.DEV
  ? lazy(() => import('./components/ink/InkEventEditor').then((m) => ({ default: m.InkEventEditor })))
  : null;

function readHashRoute(): 'editor' | 'home' {
  if (!import.meta.env.DEV) return 'home';
  const h = window.location.hash.replace(/^#/, '');
  return h === 'editor' || h.startsWith('editor/') ? 'editor' : 'home';
}

function AppContent() {
  const state = useLifeStore((s) => s.state);
  const creating = useLifeStore((s) => s.creating);
  const newLife = useLifeStore((s) => s.newLife);
  const beginCreate = useLifeStore((s) => s.beginCreate);
  const continueLife = useLifeStore((s) => s.continueLife);
  const bootstrap = useLifeStore((s) => s.bootstrap);
  const [startReady, setStartReady] = useState(false);
  const [openReincarnation, setOpenReincarnation] = useState(false);
  const [canResume, setCanResume] = useState(false);
  const [resumeHint, setResumeHint] = useState<string | undefined>();
  const [route, setRoute] = useState<'editor' | 'home'>(() =>
    typeof window !== 'undefined' ? readHashRoute() : 'home',
  );

  useEffect(() => {
    loadEventOverrides();
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const onHash = () => setRoute(readHashRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const onReady = useCallback((has: boolean, hint?: string) => {
    setCanResume(has);
    setResumeHint(hint);
    setStartReady(true);
  }, []);

  const handleSeed = useCallback(async () => {
    await resetLifeSave();
    newLife({ seed: 42, birthplace: '千燈鎮', name: '沈雲舟' });
  }, [newLife]);

  const handleContinue = useCallback(async (showReincarnation: boolean) => {
    setOpenReincarnation(showReincarnation);
    const ok = await continueLife();
    if (!ok) {
      setCanResume(false);
      setOpenReincarnation(false);
    }
  }, [continueLife]);

  const closeEditor = useCallback(() => {
    if (window.location.hash) {
      window.location.hash = '';
    } else {
      setRoute('home');
    }
  }, []);

  if (InkEventEditor && route === 'editor' && !state && !creating) {
    return (
      <Suspense fallback={null}>
        <InkEventEditor onClose={closeEditor} />
      </Suspense>
    );
  }

  if (state) {
    return <InkPlayScreen key={`${state.seed}:${state.character.flags.reincarnation_count ?? 0}`} state={state}
      openReincarnation={openReincarnation} onReincarnationClose={() => setOpenReincarnation(false)} />;
  }

  if (creating) {
    return <InkCreateScreen />;
  }

  return (
    <>
      <InkStartGate onReady={onReady} />
      <InkStartScreen
        startReady={startReady}
        onStart={beginCreate}
        onContinue={() => void handleContinue(false)}
        onReincarnate={() => void handleContinue(true)}
        resumeHint={canResume ? resumeHint : undefined}
        onSeedDebug={import.meta.env.DEV ? () => void handleSeed() : undefined}
        onOpenEditor={
          import.meta.env.DEV
            ? () => {
                window.location.hash = 'editor';
              }
            : undefined
        }
      />
    </>
  );
}

/** 開卷、創角及遊戲共用一次點墨；切換畫面不重建回饋層。 */
export default function App() {
  const paused = useLifeStore(s => Boolean(s.state?.pendingCombat || s.combatReplay));
  return <><InkTapFx paused={paused}/><AppContent/></>;
}
