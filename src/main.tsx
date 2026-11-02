import { Capacitor } from '@capacitor/core';
import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './components/ink/parchment-ui.css';
import { installPressFeedback } from './ui/pressFeedback';
import { bootCloud } from './cloud/sync';
import { readLocalSavedAt, writeLocal } from './cloud/localBridge';
import { useAncestryStore } from './store/ancestryStore';
import { useLifeStore } from './store/lifeStore';
import { loadAncestry } from './store/ancestryMeta';

// 原生安全區由獨立樣式處理；瀏覽器版本沿用現有排版。
if (Capacitor.getPlatform() === 'ios') document.documentElement.classList.add('native-ios');

installPressFeedback();

const RigLab = import.meta.env.DEV || import.meta.env.VITE_CHARACTER_RIG_LAB === '1' ? lazy(() => import('./prototypes/rigLab/CharacterRigLab')) : null;
const isRigLab = Boolean(RigLab) && new URLSearchParams(window.location.search).get('rig-lab') === '1';

// 高光時刻示範頁：?fx=highlight，只限開發版（按需載入，唔影響遊戲首屏）
const HighlightDemo = lazy(() => import('./fx/highlight/HighlightDemo'));
const isFxDemo = import.meta.env.DEV && new URLSearchParams(window.location.search).get('fx') === 'highlight';
// 第26項：只供玩家先睇原型，唔替換正式交手入口。
const BattlePreview = import.meta.env.DEV ? lazy(() => import('./prototypes/UnifiedBattlePreview')) : () => null;
const isBattlePreview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('battle-preview') === 'unified';
const SectBattlePreview = import.meta.env.DEV ? lazy(() => import('./prototypes/SectBattlePreview')) : () => null;
const isSectBattlePreview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('sect-battle-preview') === '1';
const SectWar = lazy(() => import('./components/ink/InkSectWar'));
const isSectWar = new URLSearchParams(window.location.search).get('sect-war') === '1';
const MartialPreview = import.meta.env.DEV ? lazy(() => import('./prototypes/MartialIdentityPreview')) : () => null;
const isMartialPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('martial-preview') === '1';
const OnlinePreview = import.meta.env.VITE_ONLINE_PUBLIC === '1' || (import.meta.env.DEV && import.meta.env.VITE_ONLINE_PROTOTYPE === '1')
  ? lazy(() => import('./components/ink/InkOnlinePanel')) : null;
const isOnlinePreview = Boolean(OnlinePreview) && new URLSearchParams(window.location.search).get('online') === '1';

// 雲端：開機揾身份，雲端存檔較新就先寫返本機（最多等 2.5 秒）
const boot = isRigLab || isFxDemo || isBattlePreview || isSectBattlePreview || isMartialPreview || isOnlinePreview ? Promise.resolve({ restored: false }) : bootCloud(readLocalSavedAt, writeLocal);

void boot.then(async ({ restored }) => {
  if (restored) useAncestryStore.setState({ meta: loadAncestry() });
  if(isSectWar&&!useLifeStore.getState().state)await useLifeStore.getState().continueLife();
  render();
});

function render() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {isRigLab && RigLab ? <Suspense fallback={null}><RigLab /></Suspense> : isSectWar ? <Suspense fallback={null}><SectWar onBack={()=>window.location.assign(import.meta.env.BASE_URL)} initialTrial={new URLSearchParams(window.location.search).get('trial')==='1'}/></Suspense> : isOnlinePreview && OnlinePreview ? (
        <Suspense fallback={null}><OnlinePreview standalone /></Suspense>
      ) : isSectBattlePreview ? (
        <Suspense fallback={null}><SectBattlePreview /></Suspense>
      ) : isMartialPreview ? (
        <Suspense fallback={null}><MartialPreview /></Suspense>
      ) : isBattlePreview ? (
        <Suspense fallback={null}><BattlePreview /></Suspense>
      ) : isFxDemo ? (
        <Suspense fallback={null}>
          <HighlightDemo />
        </Suspense>
      ) : (
        <App />
      )}
    </StrictMode>,
  );
}
