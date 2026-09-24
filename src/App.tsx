import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useLifeStore, resetLifeSave } from './store/lifeStore';
import { InkPlayScreen } from './components/ink/InkPlayScreen';
import { InkStartGate, InkStartScreen } from './components/ink/InkStartScreen';
import { InkCreateScreen } from './components/ink/InkCreateScreen';
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

export default function App() {
  const state = useLifeStore((s) => s.state);
  const creating = useLifeStore((s) => s.creating);
  const newLife = useLifeStore((s) => s.newLife);
  const beginCreate = useLifeStore((s) => s.beginCreate);
  const continueLife = useLifeStore((s) => s.continueLife);
  const bootstrap = useLifeStore((s) => s.bootstrap);
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
  }, []);

  const handleStart = useCallback(async () => {
    await resetLifeSave();
    beginCreate();
  }, [beginCreate]);

  const handleSeed = useCallback(async () => {
    await resetLifeSave();
    newLife({ seed: 42, birthplace: '千燈鎮', name: '沈雲舟' });
  }, [newLife]);

  const handleContinue = useCallback(async () => {
    const ok = await continueLife();
    if (!ok) setCanResume(false);
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
    return <InkPlayScreen state={state} />;
  }

  if (creating) {
    return <InkCreateScreen />;
  }

  return (
    <>
      <InkStartGate onReady={onReady} />
      <InkStartScreen
        onStart={() => void handleStart()}
        onContinue={() => void handleContinue()}
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
