import { useState } from 'react';
import { inkArtUrl } from '../../ui/inkAssets';
import type { JianghuView } from './InkFeatureMenu';
import './jianghu-art.css';

export const JIANGHU_ENTRANCE_ART = inkArtUrl('art/jianghu/entrance-paintings.webp');

/** 四格逐張畫嘅入口插圖，圖集載好先播，淨係裝飾頁首。 */
export function InkJianghuFeatureArt({ kind }: { kind: Exclude<JianghuView, 'main'> }) {
  const [ready, setReady] = useState(false);

  return (
    <span className="ink-jianghu-feature-art" data-art={kind} aria-hidden="true">
      <img
        className={ready ? 'is-ready' : undefined}
        src={JIANGHU_ENTRANCE_ART}
        width={1024}
        height={1024}
        alt=""
        decoding="async"
        onLoad={() => setReady(true)}
      />
    </span>
  );
}
