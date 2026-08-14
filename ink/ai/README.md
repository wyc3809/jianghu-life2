# AI 水墨素材包 · `public/ink/ai/`

給《江湖一生》文字遊戲用的 **AI 水墨 WebP** 素材。風格鐵律見 [`design/art/STYLE-BIBLE.md`](../../../design/art/STYLE-BIBLE.md)。

## 目錄

| 資料夾 | 用途 | 建議尺寸 |
|--------|------|----------|
| `backdrops/` | 手卷底圖（開卷／鎮居／夜山／結果霧嶺） | 1200–1440px |
| `banners/` | 事件橫幅（上方留白給字） | ~960×640 |
| `motifs/` | 單物象方印圖示 | 320×320 |
| `seals/` | 朱砂命運印 | 256×256 |

## 在程式裡怎麼找／用

```ts
import {
  INK_AI_ASSETS,
  inkAiUrl,
  pickAiEventBanner,
  aiEventBannerUrl,
  findInkAiByTag,
} from '../ui/inkAiCatalog';

// 全部列表
INK_AI_ASSETS.forEach((a) => console.log(a.id, a.titleZh));

// 直接 URL
<img src={inkAiUrl('motif-sword')} alt="" />
<img src={inkAiUrl('backdrop-town-scroll')} alt="" />

// 依事件自動選橫幅（玩法畫面已接線）
const kind = pickAiEventBanner({ title, body, tags });
const src = aiEventBannerUrl(kind);
```

索引表：[`design/art/ASSET_INDEX.md`](../../../design/art/ASSET_INDEX.md)  
再產出提示詞：[`design/art/AI-PROMPT-PACK.md`](../../../design/art/AI-PROMPT-PACK.md)
