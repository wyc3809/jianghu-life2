/** 全屏高光遮住主頁時，只停隱藏畫布的繪製，不改遊戲結算。 */
let active = 0;

/** 回傳對應的離場清理；支援StrictMode及短暫重疊的高光。 */
export function holdHighlightVisibility(): () => void {
  active++;
  document.documentElement.dataset.highlightActive = '1';
  let released = false;
  return () => {
    if (released) return;
    released = true; active--;
    if (!active) delete document.documentElement.dataset.highlightActive;
  };
}

/** 主頁Canvas可略過繪畫；演武引擎仍按原本步長推進。 */
export function highlightCoversPage(): boolean {
  return document.documentElement.dataset.highlightActive === '1';
}
