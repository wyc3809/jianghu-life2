/** 宣紙遠山 + 墨漬 + 竹角（內嵌 SVG，避免外連圖失敗） */
import type { InkPlace, InkSeason } from './sceneVariants';
import { INK_SVG, sealSvgForText } from '../../ui/inkAssets';

function InkInlineSvg({ className, markup }: { className?: string; markup: string }) {
  return (
    <span
      className={className}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: markup }}
    />
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
  /** 夜雨／奇遇時改用夜山 */
  night?: boolean;
}) {
  const useNight = night || omen || season === 'winter';
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
      <InkInlineSvg
        className="ink-mountains-img"
        markup={useNight ? INK_SVG.mountainsNight : INK_SVG.mountains}
      />
      {variant === 'hero' && <InkInlineSvg className="ink-boat-img" markup={INK_SVG.boat} />}
      <InkInlineSvg className="ink-blots-img" markup={INK_SVG.blots} />
      <InkInlineSvg className="ink-bamboo-img" markup={INK_SVG.bamboo} />
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
  const sealMarkup = sealSvgForText(text);
  return (
    <div className="ink-seal-overlay" onAnimationEnd={() => onDone?.()} aria-live="polite">
      {sealMarkup ? (
        <InkInlineSvg className="ink-seal-stamp ink-seal-stamp--svg" markup={sealMarkup} />
      ) : (
        <span className="ink-seal-stamp">{text}</span>
      )}
    </div>
  );
}

/** 結果匣角印／題簽裝飾 */
export function InkResultSeal({ text = '定' }: { text?: string }) {
  const sealMarkup = sealSvgForText(text);
  if (sealMarkup) {
    return <InkInlineSvg className="ink-result-seal ink-result-seal--svg" markup={sealMarkup} />;
  }
  return (
    <span className="ink-result-seal" aria-hidden>
      {text}
    </span>
  );
}

/** 靜態朱砂印（開卷／掩卷） */
export function InkStaticSeal({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const sealMarkup = sealSvgForText(text);
  if (sealMarkup) {
    return (
      <InkInlineSvg
        className={`ink-seal-static ink-seal-static--svg${className ? ` ${className}` : ''}`}
        markup={sealMarkup}
      />
    );
  }
  return (
    <span className={`ink-seal-static${className ? ` ${className}` : ''}`} aria-hidden>
      {text}
    </span>
  );
}

/** 事件橫幅（水墨 900×260）— 內嵌 SVG */
export function InkEventBanner({ markup, alt = '' }: { markup: string; alt?: string }) {
  return (
    <div className="ink-event-banner" role={alt ? 'img' : undefined} aria-label={alt || undefined}>
      <InkInlineSvg className="ink-event-banner-svg" markup={markup} />
    </div>
  );
}
