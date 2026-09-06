/**
 * 水墨字形文字：用 AI 生成嘅書法筆畫圖逐字砌出數字／符號。
 * 支援 0-9、+、,、/、.；其他字元用返普通文字 fallback。
 * 無障礙：容器帶 aria-label 真文字，圖片 aria-hidden。
 */

const FILE: Record<string, string> = {
  '+': 'g-plus',
  ',': 'g-comma',
  '/': 'g-slash',
  '.': 'g-dot',
};

function glyphSrc(c: string): string | null {
  if (c >= '0' && c <= '9') return `${import.meta.env.BASE_URL || '/'}ink/ui/g-${c}.webp`;
  const f = FILE[c];
  return f ? `${import.meta.env.BASE_URL || '/'}ink/ui/${f}.webp` : null;
}

interface Props {
  text: string;
  /** 字形高度（px），預設 14 */
  height?: number;
  className?: string;
}

export function InkGlyphText({ text, height = 14, className }: Props) {
  return (
    <span className={`ink-glyph-text${className ? ` ${className}` : ''}`} role="text" aria-label={text}>
      {[...text].map((c, i) => {
        const src = glyphSrc(c);
        return src ? (
          <img key={i} src={src} alt="" aria-hidden draggable={false} style={{ height }} />
        ) : (
          <span key={i}>{c}</span>
        );
      })}
    </span>
  );
}
