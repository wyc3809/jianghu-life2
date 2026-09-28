import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { installPressFeedback } from './ui/pressFeedback';

installPressFeedback();

// 高光時刻示範頁：?fx=highlight；主頁劍客：?fx=title（按需載入，唔影響遊戲首屏）
const HighlightDemo = lazy(() => import('./fx/highlight/HighlightDemo'));
const TitleDemo = lazy(() => import('./fx/highlight/title/TitleDemo'));
const fxDemo = new URLSearchParams(window.location.search).get('fx');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {fxDemo === 'highlight' ? (
      <Suspense fallback={null}>
        <HighlightDemo />
      </Suspense>
    ) : fxDemo === 'title' ? (
      // 主頁劍客示範頁：?fx=title（&still=1 淨劍客透明底）
      <Suspense fallback={null}>
        <TitleDemo />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
