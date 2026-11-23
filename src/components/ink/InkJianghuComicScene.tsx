import { useState } from 'react';
import { inkArtUrl } from '../../ui/inkAssets';
import './jianghu-comic-scenes.css';

const SCENES = {
  huashan: inkArtUrl('art/jianghu/huashan-comic.webp'),
  library: inkArtUrl('art/jianghu/library-comic.webp'),
  sect: inkArtUrl('art/jianghu/sect-comic.webp'),
} as const;
const DETAILS = inkArtUrl('art/jianghu/comic-scene-details.webp');
const MIST = inkArtUrl('art/fx/mist.webp');
const ARRIVAL_LOAD_BUDGET_MS = 450;

/** 地圖閒時先暖華山大景同霧層，縮短首次入場等圖。 */
export function preloadHuashanEntrance() {
  for (const src of [SCENES.huashan, MIST]) new Image().src = src;
}

/** 大景同局部插圖共用同一張底畫比例，保持書案及旗杆嘅接位。 */
export function InkJianghuComicScene({ kind, premium = false }: { kind: keyof typeof SCENES; premium?: boolean }) {
  const [mountedAt] = useState(() => performance.now());
  const [loaded, setLoaded] = useState(false);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [showArrival, setShowArrival] = useState(false);
  return (
    <div className="ink-jianghu-comic" data-scene={kind} data-premium={premium || undefined} aria-hidden="true">
      <div className="ink-jianghu-comic-plane">
        <img className="ink-jianghu-comic-painting" src={SCENES[kind]} width={626} height={626}
          alt="" decoding="async" onLoad={() => {
            setLoaded(true);
            if (kind === 'huashan' && performance.now() - mountedAt <= ARRIVAL_LOAD_BUDGET_MS) {
              setShowArrival(true);
            }
          }} />
        {kind !== 'huashan' && <span className="ink-jianghu-comic-prop" hidden={!loaded}>
          <img className={detailsLoaded ? 'is-ready' : undefined} src={DETAILS} width={512} height={512}
            alt="" decoding="async" onLoad={() => setDetailsLoaded(true)} />
        </span>}
      </div>
      {showArrival && (
        <div className="ink-jianghu-comic-arrival">
          <img className="ink-jianghu-comic-summit" src={SCENES.huashan} width={626} height={626} alt="" />
          <img className="ink-jianghu-comic-mist" src={MIST} alt="" />
        </div>
      )}
    </div>
  );
}
