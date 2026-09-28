/**
 * 主頁動畫示範頁：?fx=title
 * - 預設：完整主頁，撳「開卷」睇過場，完咗自動重置
 * - &slow=0.2：GSAP 放慢，逐格睇過場
 * - &still=1：透明底淨劍客（用嚟重新截靜態後備圖 public/ink/art/title/swordsman.webp）
 */
import { useState } from 'react';
import gsap from 'gsap';
import { InkStartScreen } from '../../../components/ink/InkStartScreen';
import TitleHero from './TitleHero';

export default function TitleDemo() {
  const params = new URLSearchParams(window.location.search);
  const [round, setRound] = useState(0);
  // &slow=0.2：全部 GSAP 放慢（逐格檢查過場）
  const slow = Number(params.get('slow'));
  if (slow > 0) gsap.globalTimeline.timeScale(slow);
  if (params.get('still') === '1') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'transparent' }}>
        <TitleHero play={0} onPlayed={() => {}} reduceMotion bare />
      </div>
    );
  }
  const reset = () => window.setTimeout(() => setRound((n) => n + 1), 700);
  return (
    <>
      <InkStartScreen
        key={round}
        onStart={reset}
        onContinue={reset}
        resumeHint={params.get('resume') === '1' ? '李逍遙 · 23 歲' : undefined}
      />
    </>
  );
}
