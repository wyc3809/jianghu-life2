import { useState, type CSSProperties } from 'react';
import { inkArtUrl } from '../../ui/inkAssets';
import type { JianghuView } from './InkFeatureMenu';
import './jianghu-map.css';

const MAP_SRC = inkArtUrl('art/jianghu/jianghu-map-watercolor.webp');
// 百分比座標對應已確認的 1024×1536 原圖；文字、觸控範圍與位圖分離。
const LANDMARKS = [
  { id: 'online', title: '江湖風雲', x: 2, y: 70, w: 56, h: 23,
    clip: 'polygon(2% 76%, 8% 71%, 16% 70%, 20% 76%, 30% 74%, 36% 78%, 45% 79%, 49% 85%, 57% 89%, 50% 93%, 24% 93%, 6% 88%)' },
  { id: 'gacha', title: '秘笈閣', x: 5, y: 24, w: 42, h: 20,
    clip: 'polygon(9% 27%, 12% 24%, 15% 23%, 17% 28%, 24% 28%, 27% 26%, 29% 28%, 35% 28%, 38% 31%, 41% 32%, 42% 37%, 36% 39%, 39% 44%, 20% 44%, 14% 40%, 9% 37%)' },
  { id: 'huashan', title: '華山論劍', x: 58, y: 6, w: 40, h: 35,
    clip: 'polygon(65% 7%, 73% 5%, 78% 8%, 92% 9%, 96% 12%, 96% 20%, 98% 25%, 97% 34%, 98% 39%, 85% 41%, 69% 36%, 60% 25%, 57% 17%)' },
  { id: 'founder', title: '開宗立派', x: 50, y: 47, w: 49, h: 23,
    clip: 'polygon(52% 55%, 64% 51%, 70% 49%, 76% 47%, 87% 48%, 92% 50%, 97% 51%, 99% 54%, 99% 64%, 91% 68%, 85% 70%, 64% 70%, 53% 65%)' },
] as const;

/** 淡彩地圖入口：建築與題字共用按鈕，點擊只切換既有功能頁。 */
export function InkJianghuMap({ online, onOpen }: { online: boolean; onOpen: (view: JianghuView) => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  return <section className={`ink-jianghu-map${imageFailed ? ' ink-jianghu-map--fallback' : ''}`} aria-label="江湖地圖" id="ink-jianghu-menu">
    <div className="ink-jianghu-map-heading"><h2>江湖</h2><span>點選地標</span></div>
    <div className="ink-jianghu-map-stage">
      <img className="ink-jianghu-map-art" src={MAP_SRC} width={1024} height={1536} alt="山寺、華山論劍台、門派山莊與河畔城鎮，以山徑和石橋相連。" fetchPriority="high" decoding="async" onError={() => setImageFailed(true)} />
      <nav aria-label="江湖功能">
        {LANDMARKS.filter(place => place.id !== 'online' || online).map(place => {
          const style = { left: `${place.x}%`, top: `${place.y}%`, width: `${place.w}%`, height: `${place.h}%`, '--landmark-clip': place.clip } as CSSProperties;
          const fragmentStyle = { left: `${-place.x / place.w * 100}%`, top: `${-place.y / place.h * 100}%`, width: `${100 / place.w * 100}%`, height: `${100 / place.h * 100}%` };
          return <button type="button" key={place.id} className={`ink-map-destination ink-map-destination--${place.id}`} style={style} aria-label={place.title} onClick={() => onOpen(place.id)}>
            {!imageFailed && <span className="ink-map-destination-light" style={fragmentStyle} aria-hidden="true"><span style={{ backgroundImage: `url("${MAP_SRC}")` }} /></span>}
            <span className="ink-map-destination-name"><span className="ink-map-destination-dot" aria-hidden="true" />{place.title}</span>
          </button>;
        })}
      </nav>
    </div>
  </section>;
}
