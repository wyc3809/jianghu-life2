import { useEffect, useRef } from 'react';
import reviewHtml from '../../../design/art/spine-character/runtime/review.html?raw';

/** 內測頁隔離播放已輸出的Spine資料，不連接戰鬥、人物裝備或存檔。 */
export default function SpineCharacterLab() {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow && event.data?.type === 'spine-lab-back') {
        window.location.assign(import.meta.env.BASE_URL);
      }
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
    };
  }, []);
  return <iframe ref={frame} title="Spine人物動畫驗收" srcDoc={reviewHtml} sandbox="allow-scripts allow-same-origin" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, background: '#f6efe0' }} />;
}
