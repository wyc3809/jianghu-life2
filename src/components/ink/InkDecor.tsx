/** 宣紙底圖、朱砂印、事件橫幅 — 全為 WebP 位圖（無 SVG 手繪） */
import type { InkPlace, InkSeason } from './sceneVariants';
import { sealUrlForText } from '../../ui/inkAssets';
import { inkAiUrl } from '../../ui/inkAiCatalog';

/** 裝飾用位圖：外層 span 承接尺寸／動畫 class，內層 img 撐滿 */
export function InkArt({ className, src }: { className?: string; src: string }) {
  return (
    <span className={className} aria-hidden>
      <img src={src} alt="" decoding="async" draggable={false} />
    </span>
  );
}

export function InkScrollBackdrop({
  variant = 'play',
  quiet = false,
  season,
  place,
  omen = false,
  night = false,
}: {
  variant?: 'hero' | 'play';
  quiet?: boolean;
  season?: InkSeason;
  place?: InkPlace;
  omen?: boolean;
  /** 夜雨／奇遇時改用夜山底圖 */
  night?: boolean;
}) {
  const useNight = night || omen;
  const scene = [
    season ? `ink-backdrop--${season}` : '',
    place ? `ink-backdrop--${place}` : '',
    omen ? 'ink-backdrop--omen' : '',
    useNight ? 'ink-backdrop--night' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`ink-backdrop ink-backdrop--${variant}${quiet ? ' ink-backdrop--quiet' : ''}${scene ? ` ${scene}` : ''}`}
      aria-hidden
    >
      <img
        className="ink-backdrop-ai"
        src={inkAiUrl(useNight ? 'backdrop-night-mountains' : 'backdrop-play-main')}
        alt=""
        aria-hidden
        decoding="async"
      />
      {/* 平時只留一層靜霧；掃筆僅在翻頁時由 .ink-scroll-flip 觸發 */}
      <div className="ink-mist-layer" />
      <div className="ink-paper-edge" />
    </div>
  );
}

export function InkSealStamp({
  text,
  onDone,
}: {
  text: string;
  onDone?: () => void;
}) {
  const sealSrc = sealUrlForText(text);
  return (
    <div className="ink-seal-overlay" onAnimationEnd={() => onDone?.()} aria-live="polite">
      {sealSrc ? (
        <img className="ink-seal-stamp ink-seal-stamp--img" src={sealSrc} alt={text} decoding="async" />
      ) : (
        <span className="ink-seal-stamp">{text}</span>
      )}
    </div>
  );
}

/** 結果匣角印／題簽裝飾 */
export function InkResultSeal({ text = '定' }: { text?: string }) {
  const sealSrc = sealUrlForText(text);
  if (sealSrc) {
    return <InkArt className="ink-result-seal ink-result-seal--art" src={sealSrc} />;
  }
  return (
    <span className="ink-result-seal" aria-hidden>
      {text}
    </span>
  );
}

/** 靜態朱砂印（開卷／掩卷）— 逐字朱砂印位圖；無對應字則 CSS 字印 */
export function InkStaticSeal({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const sealSrc = sealUrlForText(text);
  if (sealSrc) {
    return (
      <img
        className={`ink-seal-static ink-seal-static--img${className ? ` ${className}` : ''}`}
        src={sealSrc}
        alt=""
        aria-hidden
        decoding="async"
      />
    );
  }
  return (
    <span className={`ink-seal-static${className ? ` ${className}` : ''}`} aria-hidden>
      {text}
    </span>
  );
}

/** 事件橫幅 — AI 水墨 WebP */
export function InkEventBanner({ src, alt = '' }: { src?: string | null; alt?: string }) {
  if (!src) return null;
  return (
    <div className="ink-event-banner" role={alt ? 'img' : undefined} aria-label={alt || undefined}>
      <img className="ink-event-banner-img" src={src} alt="" decoding="async" />
    </div>
  );
}

/** AI 水墨底圖層 */
export function InkAiWashLayer({
  src,
  className = 'ink-ai-wash',
}: {
  src: string;
  className?: string;
}) {
  return <img className={className} src={src} alt="" aria-hidden decoding="async" />;
}
