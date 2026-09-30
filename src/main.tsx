import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { installPressFeedback } from './ui/pressFeedback';

installPressFeedback();

// 高光時刻示範頁：?fx=highlight（按需載入，唔影響遊戲首屏）
const HighlightDemo = lazy(() => import('./fx/highlight/HighlightDemo'));
const isFxDemo = new URLSearchParams(window.location.search).get('fx') === 'highlight';

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
