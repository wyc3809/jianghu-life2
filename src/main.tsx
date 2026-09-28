import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { installPressFeedback } from './ui/pressFeedback';

installPressFeedback();

// 示範頁：?fx=highlight 高光時刻、?fx=spar 演武台（按需載入，唔影響遊戲首屏）
const HighlightDemo = lazy(() => import('./fx/highlight/HighlightDemo'));
const SparDemo = lazy(() => import('./spar/v4/SparDemo'));
const fxDemo = new URLSearchParams(window.location.search).get('fx');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {fxDemo === 'highlight' ? (
      <Suspense fallback={null}>
        <HighlightDemo />
      </Suspense>
    ) : fxDemo === 'spar' ? (
      // 演武台示範頁：?fx=spar
      <Suspense fallback={null}>
        <SparDemo />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
