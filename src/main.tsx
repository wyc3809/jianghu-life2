import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { installPressFeedback } from './ui/pressFeedback';
import { bootCloud } from './cloud/sync';
import { readLocalSavedAt, writeLocal } from './cloud/localBridge';
import { useAncestryStore } from './store/ancestryStore';
import { loadAncestry } from './store/ancestryMeta';

installPressFeedback();

// 高光時刻示範頁：?fx=highlight，只限開發版（按需載入，唔影響遊戲首屏）
const HighlightDemo = lazy(() => import('./fx/highlight/HighlightDemo'));
const isFxDemo = import.meta.env.DEV && new URLSearchParams(window.location.search).get('fx') === 'highlight';
// 第26項：只供玩家先睇原型，唔替換正式交手入口。
const BattlePreview = import.meta.env.DEV ? lazy(() => import('./prototypes/UnifiedBattlePreview')) : () => null;
const isBattlePreview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('battle-preview') === 'unified';

// 雲端：開機揾身份，雲端存檔較新就先寫返本機（最多等 2.5 秒）
const boot = isFxDemo || isBattlePreview ? Promise.resolve({ restored: false }) : bootCloud(readLocalSavedAt, writeLocal);

void boot.then(({ restored }) => {
  if (restored) useAncestryStore.setState({ meta: loadAncestry() });
  render();
});

function render() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {isBattlePreview ? (
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
