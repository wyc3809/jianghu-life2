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

// 高光時刻示範頁：?fx=highlight（按需載入，唔影響遊戲首屏）
const HighlightDemo = lazy(() => import('./fx/highlight/HighlightDemo'));
const isFxDemo = new URLSearchParams(window.location.search).get('fx') === 'highlight';

// 雲端：開機揾身份，雲端存檔較新就先寫返本機（最多等 2.5 秒）
const boot = isFxDemo ? Promise.resolve({ restored: false }) : bootCloud(readLocalSavedAt, writeLocal);

void boot.then(({ restored }) => {
  if (restored) useAncestryStore.setState({ meta: loadAncestry() });
  render();
});

function render() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {isFxDemo ? (
        <Suspense fallback={null}>
          <HighlightDemo />
        </Suspense>
      ) : (
        <App />
      )}
    </StrictMode>,
  );
}
